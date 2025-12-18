# Design: add-group-sharing

## Architecture Overview

分享功能采用**三层架构**：

1. **数据层**：新增 `shares` 和 `share_invitations` 表，关联现有 `groups` 和 `users` 表
2. **API 层**：新增分享管理和访问验证的 RESTful API 端点
3. **UI 层**：在 group 管理界面添加分享入口，新增分享访问页面

### 数据模型设计

```prisma
// 分享表 - 核心实体
model Share {
  id          String            @id @default(nanoid(21))  // 公开的分享 ID
  userId      Int               @map("user_id")           // 分享创建者
  groupId     Int               @map("group_id")          // 被分享的 group
  type        ShareType                                   // PUBLIC | PRIVATE
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  group       Group             @relation(fields: [groupId], references: [id], onDelete: Cascade)
  invitations ShareInvitation[]

  @@unique([groupId])  // 一个 group 只能有一个活跃分享
  @@index([userId])
  @@map("shares")
}

// 分享邀请表 - 仅用于 PRIVATE 分享
model ShareInvitation {
  id          Int               @id @default(autoincrement())
  shareId     String            @map("share_id")
  email       String                                      // 被邀请用户邮箱
  status      InvitationStatus  @default(PENDING)        // PENDING | ACCEPTED | REJECTED
  invitedAt   DateTime          @default(now())
  respondedAt DateTime?

  share       Share             @relation(fields: [shareId], references: [id], onDelete: Cascade)

  @@unique([shareId, email])  // 同一分享不能重复邀请同一邮箱
  @@index([email])
  @@map("share_invitations")
}

enum ShareType {
  PUBLIC
  PRIVATE
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  REJECTED
}
```

**设计决策：**

1. **分享 ID 使用 nanoid**：
   - 21 字符，URL 安全，碰撞概率极低（~1000 年才可能碰撞）
   - 不可预测，防止枚举攻击
   - 比 UUID 更短，适合分享链接

2. **一个 group 只能有一个活跃分享**：
   - 使用 `@@unique([groupId])` 约束
   - 简化逻辑，避免多分享冲突
   - 如需修改分享类型，需先撤销旧分享

3. **邀请表独立存储**：
   - 支持一个分享邀请多个用户
   - 记录邀请状态和响应时间
   - 级联删除：撤销分享时自动删除所有邀请

### API 设计

#### 分享管理 API

```typescript
// 创建分享
POST /api/shares
Body: {
  groupId: number;
  type: 'PUBLIC' | 'PRIVATE';
  emails?: string[];  // PRIVATE 模式必填
}
Response: {
  id: string;
  shareUrl: string;
  type: string;
  invitations?: Array<{ email: string; status: string }>;
}

// 获取用户的所有分享
GET /api/shares
Response: Array<{
  id: string;
  type: string;
  group: { id: number; name: string };
  createdAt: string;
  invitations?: Array<{ email: string; status: string }>;
}>

// 撤销分享
DELETE /api/shares/{shareId}
Response: { success: true }

// 重新发送邀请邮件
POST /api/shares/{shareId}/invitations/{email}/resend
Response: { success: true }
```

#### 分享访问 API

```typescript
// 获取分享内容（公开或已授权）
GET /api/shares/{shareId}/content
Response: {
  share: {
    id: string;
    type: string;
    group: {
      id: number;
      name: string;
      description: string;
      items: Array<{
        id: number;
        key: string;
        value: string;
        tags: Array<{ tag: string }>;
      }>;
    };
  };
  access: {
    canView: boolean;
    reason?: string;  // 如果不能访问，说明原因
  };
}

// 接受邀请
POST /api/shares/{shareId}/accept
Response: { success: true }

// 拒绝邀请
POST /api/shares/{shareId}/reject
Response: { success: true }
```

### 权限验证逻辑

```typescript
// 分享访问权限验证伪代码
async function canAccessShare(shareId: string, session: Session | null) {
  const share = await prisma.share.findUnique({
    where: { id: shareId },
    include: { group: { include: { items: { include: { tags: true } } } } }
  });

  if (!share) return { canView: false, reason: 'Share not found' };

  // PUBLIC 分享：任何人都可以访问
  if (share.type === 'PUBLIC') {
    return { canView: true, share };
  }

  // PRIVATE 分享：需要登录且被邀请
  if (!session?.user?.email) {
    return { canView: false, reason: 'Login required' };
  }

  const invitation = await prisma.shareInvitation.findUnique({
    where: {
      shareId_email: {
        shareId: shareId,
        email: session.user.email
      }
    }
  });

  if (!invitation) {
    return { canView: false, reason: 'Not invited' };
  }

  if (invitation.status === 'REJECTED') {
    return { canView: false, reason: 'Invitation rejected' };
  }

  if (invitation.status === 'PENDING') {
    return { canView: false, reason: 'Invitation not accepted', invitation };
  }

  // ACCEPTED
  return { canView: true, share };
}
```

### 邮件系统设计

**邮件服务选择：Resend**

- 优点：简单易用，免费额度充足（100 封/天），官方 Next.js 集成
- 配置：仅需 API key，无需 SMTP 配置
- 安装：`pnpm add resend`

**邮件模板：**

```typescript
// 邀请邮件模板
interface InvitationEmailData {
  inviterName: string;
  inviterEmail: string;
  groupName: string;
  acceptUrl: string;
  rejectUrl: string;
}

const invitationEmailTemplate = (data: InvitationEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; margin: 10px 5px;
              text-decoration: none; border-radius: 6px; font-weight: bold; }
    .accept { background: #10b981; color: white; }
    .reject { background: #ef4444; color: white; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Group 分享邀请</h1>
    </div>
    <div class="content">
      <p>您好，</p>
      <p><strong>${data.inviterName}</strong> (${data.inviterEmail}) 邀请您查看以下 Group：</p>
      <p style="font-size: 18px; font-weight: bold; color: #0ea5e9;">📦 ${data.groupName}</p>
      <p>这是一个只读分享，您可以查看该 Group 中的所有配置项。</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.acceptUrl}" class="button accept">接受邀请</a>
        <a href="${data.rejectUrl}" class="button reject">拒绝邀请</a>
      </div>
      <p style="font-size: 12px; color: #6b7280;">
        如果您不认识邀请者，请忽略此邮件或点击"拒绝邀请"。
      </p>
    </div>
    <div class="footer">
      <p>此邮件由 Key Management 系统自动发送</p>
    </div>
  </div>
</body>
</html>
`;
```

### UI/UX 设计

#### 1. Group 列表页添加分享入口

在每个 group 行添加"分享"按钮（图标：Share2）：

```tsx
// components/groups/group-list.tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleShare(group.id)}
>
  <Share2 className="h-4 w-4" />
</Button>
```

#### 2. 分享创建对话框

```tsx
// components/groups/share-dialog.tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>分享 Group: {groupName}</DialogTitle>
    </DialogHeader>

    {/* 分享类型选择 */}
    <RadioGroup value={shareType} onValueChange={setShareType}>
      <div>
        <RadioGroupItem value="PUBLIC" />
        <Label>
          公开分享
          <p className="text-sm text-muted-foreground">
            任何人都可以通过链接访问（无需登录）
          </p>
        </Label>
      </div>
      <div>
        <RadioGroupItem value="PRIVATE" />
        <Label>
          私密分享
          <p className="text-sm text-muted-foreground">
            仅邀请的用户可以访问（需登录）
          </p>
        </Label>
      </div>
    </RadioGroup>

    {/* PRIVATE 模式：邮箱输入 */}
    {shareType === 'PRIVATE' && (
      <div>
        <Label>邀请用户（邮箱）</Label>
        <TagInput
          value={emails}
          onChange={setEmails}
          placeholder="输入邮箱地址，按回车添加"
        />
      </div>
    )}

    {/* 警告提示 */}
    {shareType === 'PUBLIC' && (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          公开分享链接可能被任何人访问，请勿分享敏感数据
        </AlertDescription>
      </Alert>
    )}

    <DialogFooter>
      <Button onClick={handleCreateShare}>创建分享</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 3. 分享管理页面

新增 `/shares` 页面，显示用户创建的所有分享：

```tsx
// app/shares/page.tsx
<div>
  <h1>我的分享</h1>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Group 名称</TableHead>
        <TableHead>类型</TableHead>
        <TableHead>创建时间</TableHead>
        <TableHead>邀请状态</TableHead>
        <TableHead>操作</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {shares.map(share => (
        <TableRow key={share.id}>
          <TableCell>{share.group.name}</TableCell>
          <TableCell>
            <Badge variant={share.type === 'PUBLIC' ? 'default' : 'secondary'}>
              {share.type === 'PUBLIC' ? '公开' : '私密'}
            </Badge>
          </TableCell>
          <TableCell>{formatDate(share.createdAt)}</TableCell>
          <TableCell>
            {share.type === 'PRIVATE' && (
              <div>
                {share.invitations.filter(i => i.status === 'ACCEPTED').length} /
                {share.invitations.length} 已接受
              </div>
            )}
          </TableCell>
          <TableCell>
            <Button onClick={() => copyShareLink(share.id)}>
              复制链接
            </Button>
            <Button variant="destructive" onClick={() => revokeShare(share.id)}>
              撤销
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

#### 4. 分享访问页面

```tsx
// app/share/[shareId]/page.tsx
<div>
  {/* 只读标识 */}
  <Alert>
    <Info className="h-4 w-4" />
    <AlertDescription>
      这是一个只读分享，您无法编辑内容
    </AlertDescription>
  </Alert>

  {/* Group 信息 */}
  <Card>
    <CardHeader>
      <CardTitle>{group.name}</CardTitle>
      <CardDescription>{group.description}</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Items 列表（只读） */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {group.items.map(item => (
            <TableRow key={item.id}>
              <TableCell>{item.key}</TableCell>
              <TableCell>{item.value}</TableCell>
              <TableCell>
                {item.tags.map(tag => (
                  <Badge key={tag.id}>{tag.tag}</Badge>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
```

#### 5. 邀请接受页面

```tsx
// app/share/[shareId]/accept/page.tsx
<div>
  <Card>
    <CardHeader>
      <CardTitle>接受分享邀请</CardTitle>
    </CardHeader>
    <CardContent>
      <p>
        <strong>{inviterName}</strong> 邀请您查看 Group：
        <strong>{groupName}</strong>
      </p>
      <div>
        <Button onClick={handleAccept}>接受邀请</Button>
        <Button variant="outline" onClick={handleReject}>拒绝邀请</Button>
      </div>
    </CardContent>
  </Card>
</div>
```

### 技术实现细节

#### 1. 分享链接生成

```typescript
// lib/share-utils.ts
import { nanoid } from 'nanoid';

export function generateShareId(): string {
  return nanoid(21);  // 21 字符，URL 安全
}

export function getShareUrl(shareId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3100';
  return `${baseUrl}/share/${shareId}`;
}

export function getInvitationAcceptUrl(shareId: string): string {
  return `${getShareUrl(shareId)}/accept`;
}

export function getInvitationRejectUrl(shareId: string): string {
  return `${getShareUrl(shareId)}/reject`;
}
```

#### 2. 邮件发送服务

```typescript
// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail(
  to: string,
  data: InvitationEmailData
): Promise<void> {
  await resend.emails.send({
    from: 'Key Management <noreply@yourdomain.com>',
    to,
    subject: `${data.inviterName} 邀请您查看 Group: ${data.groupName}`,
    html: invitationEmailTemplate(data),
  });
}
```

#### 3. 分享访问中间件

```typescript
// middleware.ts (扩展现有中间件)
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开分享路径不需要认证
  if (pathname.startsWith('/share/')) {
    return NextResponse.next();
  }

  // 其他路径继续现有认证逻辑
  // ...
}
```

### 数据库迁移策略

```sql
-- Migration: add_group_sharing

-- 创建 ShareType 枚举
CREATE TYPE "ShareType" AS ENUM ('PUBLIC', 'PRIVATE');

-- 创建 InvitationStatus 枚举
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- 创建 shares 表
CREATE TABLE "shares" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "group_id" INTEGER NOT NULL,
  "type" "ShareType" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "shares_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE
);

-- 创建唯一索引
CREATE UNIQUE INDEX "shares_group_id_key" ON "shares"("group_id");
CREATE INDEX "shares_user_id_idx" ON "shares"("user_id");

-- 创建 share_invitations 表
CREATE TABLE "share_invitations" (
  "id" SERIAL PRIMARY KEY,
  "share_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "responded_at" TIMESTAMP(3),
  CONSTRAINT "share_invitations_share_id_fkey" FOREIGN KEY ("share_id") REFERENCES "shares"("id") ON DELETE CASCADE
);

-- 创建唯一索引
CREATE UNIQUE INDEX "share_invitations_share_id_email_key" ON "share_invitations"("share_id", "email");
CREATE INDEX "share_invitations_email_idx" ON "share_invitations"("email");
```

## Trade-offs

### 1. 一个 group 只能有一个活跃分享

**优点：**
- 简化逻辑，避免多分享冲突
- 数据库约束保证一致性
- 用户理解成本低

**缺点：**
- 无法同时创建 public 和 private 分享
- 修改分享类型需要先撤销旧分享

**决策：** 采用此方案，未来如需支持多分享可扩展

### 2. 邀请接受后不可撤销

**优点：**
- 简化状态管理
- 避免用户反复接受/拒绝

**缺点：**
- 用户误操作后无法撤销

**决策：** 采用此方案，分享创建者可以撤销整个分享来移除访问权限

### 3. 使用 Resend 而非 Nodemailer

**优点：**
- 配置简单，仅需 API key
- 免费额度充足（100 封/天）
- 官方 Next.js 集成

**缺点：**
- 依赖第三方服务
- 免费额度有限

**决策：** 采用 Resend，未来可扩展支持其他邮件服务

### 4. 分享 ID 使用 nanoid 而非 UUID

**优点：**
- 更短（21 vs 36 字符）
- URL 安全，无需编码
- 碰撞概率极低

**缺点：**
- 非标准格式

**决策：** 采用 nanoid，更适合分享链接场景

## Performance Considerations

**数据库查询优化：**
- 在 `shares.userId` 和 `share_invitations.email` 上创建索引
- 使用 Prisma `include` 一次性加载关联数据，避免 N+1 查询

**邮件发送优化：**
- 批量邀请时使用异步发送，避免阻塞 API 响应
- 考虑使用队列系统（如 BullMQ）处理大量邮件

**缓存策略：**
- Public 分享内容可以缓存（使用 Next.js ISR）
- Private 分享不缓存，确保权限实时验证

## Security Considerations

**分享 ID 安全：**
- 使用 nanoid 生成不可预测的 ID
- 不使用自增 ID，防止枚举攻击

**邮件安全：**
- 验证邮箱格式，防止注入攻击
- 邀请链接包含加密 token，防止伪造

**权限验证：**
- 每次访问分享内容都验证权限
- 撤销分享后立即失效，不依赖缓存

**数据泄露防护：**
- Public 分享显示警告，提醒用户不要分享敏感数据
- 考虑添加 rate limiting，防止爬虫

## Testing Strategy

**单元测试：**
- 分享 ID 生成唯一性
- 权限验证逻辑
- 邮件模板渲染

**集成测试：**
- 创建/撤销分享 API
- 邀请接受/拒绝流程
- 分享访问权限验证

**端到端测试：**
- 完整的 public 分享流程
- 完整的 private 分享和邀请流程
- 撤销分享后访问失败

**安全测试：**
- 尝试访问未授权的分享
- 尝试枚举分享 ID
- 尝试伪造邀请链接
