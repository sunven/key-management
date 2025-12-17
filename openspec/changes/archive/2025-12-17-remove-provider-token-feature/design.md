# Design Document: Remove Provider-Token Feature

## Architecture Overview

此设计文档描述了完全移除 provider-token 功能的技术方案。这是一个破坏性变更，涉及数据库、API、UI 和文档的全面清理。

## Current Architecture

### 当前数据模型

```
User (NextAuth)
  ├── providers (一对多)
  │   └── Provider
  │       ├── id (PK)
  │       ├── userId (FK -> User.id, CASCADE)
  │       ├── baseUrl
  │       ├── name
  │       ├── description
  │       ├── active
  │       └── tokens (一对多)
  │           └── Token
  │               ├── id (PK)
  │               ├── providerId (FK -> Provider.id, CASCADE)
  │               ├── token (明文存储)
  │               └── description
  │
  ├── groups (一对多，独立)
  │   └── Group
  │       └── items
  │           └── tags
  │
  └── shares (一对多，独立)
      └── Share
          └── invitations (使用 invitation token，与 API token 无关)
```

### 当前路由结构

**UI 路由**：
- `/` - 仪表板（显示 provider/token 统计）
- `/providers` - Provider 管理页面
- `/tokens` - Token 管理页面（或在 provider 页面内）
- `/groups` - Groups 管理
- `/shares` - Shares 管理

**API 路由**：
- `/api/providers` - Provider CRUD
- `/api/providers/[id]` - 单个 Provider 操作
- `/api/tokens` - Token CRUD
- `/api/tokens/[id]` - 单个 Token 操作
- `/api/groups/*` - Groups API（保持不变）
- `/api/shares/*` - Shares API（保持不变）

## Target Architecture

### 目标数据模型

```
User (NextAuth)
  ├── groups (一对多)
  │   └── Group
  │       └── items
  │           └── tags
  │
  └── shares (一对多)
      └── Share
          └── invitations
```

**移除的表**：
- `providers` - 完全删除
- `tokens` - 完全删除

**保留的关系**：
- User -> Groups（不变）
- User -> Shares（不变）
- Group -> GroupItems -> ItemTags（不变）
- Share -> ShareInvitations（不变）

### 目标路由结构

**UI 路由**：
- `/` - 仪表板（仅显示 groups/shares 统计）
- `/groups` - Groups 管理
- `/shares` - Shares 管理
- `/providers` - ❌ 删除（返回 404）
- `/tokens` - ❌ 删除（返回 404）

**API 路由**：
- `/api/groups/*` - Groups API（保持不变）
- `/api/shares/*` - Shares API（保持不变）
- `/api/providers/*` - ❌ 删除（返回 404）
- `/api/tokens/*` - ❌ 删除（返回 404）

## Technical Decisions

### 1. 数据库迁移策略

**决定**：使用 Prisma Migrate 创建不可逆的 DROP TABLE 迁移

**理由**：
- 彻底删除，无残留
- 明确的意图表达
- 减少数据库维护负担

**实现**：
```prisma
// prisma/schema.prisma 变更

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())

  // providers Provider[] ❌ 移除
  groups    Group[]
  shares    Share[]
}

// ❌ 完全删除 Provider 模型
// ❌ 完全删除 Token 模型
```

**生成的迁移 SQL**（预期）：
```sql
-- Drop foreign key constraints first
ALTER TABLE "tokens" DROP CONSTRAINT "tokens_provider_id_fkey";
ALTER TABLE "providers" DROP CONSTRAINT "providers_user_id_fkey";

-- Drop tables
DROP TABLE "tokens";
DROP TABLE "providers";
```

### 2. 组件移除策略

**决定**：完整删除目录，不保留注释或占位符

**受影响的组件**：

| 组件路径 | 描述 | 操作 |
|---------|------|------|
| `components/providers/provider-list.tsx` | Provider 列表 | 删除 |
| `components/providers/provider-dialog.tsx` | Provider 对话框 | 删除 |
| `components/providers/provider-token-list.tsx` | Provider-Token 统一视图 | 删除 |
| `components/tokens/token-dialog.tsx` | Token 对话框 | 删除 |
| `app/providers/page.tsx` | Provider 页面 | 删除 |
| `app/tokens/page.tsx` | Token 页面（如存在） | 删除 |

**理由**：
- 避免死代码
- 简化代码库
- 减少混淆

### 3. 仪表板重构

**当前实现**（`app/page.tsx`）：
```typescript
// 查询 providers 和 tokens
const userProviders = await prisma.provider.findMany({
  where: { userId },
  include: { tokens: true },
});

const activeProviders = userProviders.filter(p => p.active).length;
const totalTokens = userProviders.reduce((sum, p) => sum + p.tokens.length, 0);
```

**目标实现**：
```typescript
// 只查询 groups 和 shares
const groupsCount = await prisma.group.count({
  where: { userId },
});

const sharesCount = await prisma.share.count({
  where: { userId },
});
```

**UI 变更**：
- ❌ 移除卡片：Total Providers, Active Providers, Total Tokens
- ✅ 保留卡片：Total Groups, Account Status
- ✅ 新增卡片：Total Shares（如需要）
- ❌ 移除：Recent Providers 卡片
- ✅ 保留：Quick Actions（只显示 MANAGE_GROUPS 和 MANAGE_SHARES）

### 4. 导航栏更新

**当前**（`components/layout/navbar.tsx`）：
```tsx
<Link href="/">DASHBOARD</Link>
<Link href="/providers">PROVIDERS</Link>
<Link href="/groups">GROUPS</Link>
<Link href="/shares">SHARES</Link>
```

**目标**：
```tsx
<Link href="/">DASHBOARD</Link>
<Link href="/groups">GROUPS</Link>
<Link href="/shares">SHARES</Link>
```

### 5. Schema 验证清理

**当前**（`lib/schemas.ts`）：
```typescript
export const providerSchema = z.object({ ... });
export const tokenSchema = z.object({ ... });
export const tokenFormSchema = z.object({ ... });
```

**目标**：
```typescript
// ❌ 完全移除所有 provider/token schemas
// ✅ 保留 group 和 share schemas
export const groupSchema = z.object({ ... });
export const shareSchema = z.object({ ... });
```

### 6. 处理 "token" 术语的歧义

**重要区分**：
- **API Token**（将被删除）：`tokens` 表中存储的 API 密钥
- **Invitation Token**（保留）：Share 功能中用于邀请的临时令牌

**搜索策略**：
```bash
# 查找 API token 引用（需要删除）
rg -i "token" --type ts --glob "!**/shares/**" --glob "!**/share-utils.ts"

# Invitation token 引用（保留）
rg -i "invitation.*token|token.*invitation" --type ts
```

**保留的文件**：
- `lib/share-utils.ts` - 包含 `createInvitationToken`, `decodeInvitationToken`
- `app/api/shares/**/route.ts` - 使用 invitation token 的 API

### 7. 404 处理策略

**决定**：不创建重定向，让 Next.js 自然返回 404

**理由**：
- 明确表示功能已移除
- 不会误导用户
- 简化实现

**行为**：
- 访问 `/providers` → Next.js 404 页面
- 访问 `/tokens` → Next.js 404 页面
- API 请求 `/api/providers` → 404 JSON 响应
- API 请求 `/api/tokens` → 404 JSON 响应

## Implementation Sequence

### 阶段 1: 代码移除（无数据库变更）

1. 删除 UI 组件目录
2. 删除 API 路由目录
3. 更新仪表板移除 provider 查询
4. 更新导航栏移除链接
5. 清理 schemas.ts

**验证**：TypeScript 编译错误会指向所有未处理的引用

### 阶段 2: 数据库变更

1. 更新 `prisma/schema.prisma`
2. 运行 `pnpm db:generate`
3. 运行 `pnpm db:migrate`
4. 验证迁移 SQL

**验证**：Prisma Client 生成成功，不包含 Provider/Token 类型

### 阶段 3: 文档和规范清理

1. 删除 `openspec/specs/provider-token-management/`
2. 更新 `openspec/project.md`
3. 更新 `CLAUDE.md`
4. 更新 `README.md`

**验证**：`openspec list --specs` 不显示已删除的规范

## Rollback Plan

### 如果需要回滚

**数据恢复**：
1. 停止应用
2. 从备份恢复数据库
3. 验证数据完整性

**代码恢复**：
```bash
git revert <commit-hash>
pnpm db:generate
pnpm dev
```

**注意**：
- 数据库迁移是不可逆的，只能通过备份恢复
- 建议在执行前在非生产环境测试完整流程

## Testing Strategy

### 单元测试

当前项目无自动化测试，依赖手动测试。

### 手动测试清单

**仪表板测试**：
- [ ] 访问 `/` 显示 groups/shares 统计
- [ ] 不显示 provider/token 统计卡片
- [ ] Quick Actions 只显示 MANAGE_GROUPS

**导航测试**：
- [ ] 导航栏不显示 PROVIDERS 链接
- [ ] 导航栏显示 DASHBOARD, GROUPS, SHARES

**404 测试**：
- [ ] 访问 `/providers` 返回 404
- [ ] 访问 `/tokens` 返回 404
- [ ] GET `/api/providers` 返回 404
- [ ] POST `/api/providers` 返回 404

**功能完整性测试**：
- [ ] Groups CRUD 功能正常
- [ ] Shares 创建和管理正常
- [ ] 邀请 token 功能正常（区别于 API token）

**构建测试**：
- [ ] `pnpm build` 成功
- [ ] `pnpm lint` 无错误
- [ ] 无 TypeScript 编译错误

## Security Considerations

### 敏感数据清理

**API Tokens 存储**：
- 当前 tokens 表以明文存储 API 密钥
- 删除表将永久移除这些敏感数据
- 这是一个积极的安全改进

**备份安全**：
- 确保数据库备份也受到保护
- 如不再需要 provider/token 数据，考虑从备份中清除

### 访问控制

删除后的访问尝试：
- API 端点将返回 404（不是 401/403）
- 不会泄露端点曾经存在的信息

## Performance Impact

### 预期改进

1. **数据库查询**：
   - 仪表板查询减少（不再查询 providers 和 tokens）
   - 减少关系查询开销

2. **客户端包大小**：
   - 移除 provider/token 组件代码
   - 减少 JavaScript bundle 大小（预计 ~10-20KB）

3. **维护负担**：
   - 减少需要维护的 API 端点
   - 简化数据模型

## Documentation Updates

### 需要更新的文档

1. **CLAUDE.md**：
   - 移除 provider-token 架构描述
   - 更新数据库 schema 图
   - 移除相关 API 模式示例
   - 更新 "Common Tasks" 部分

2. **openspec/project.md**：
   - 更新项目目的描述
   - 移除 provider-token 技术栈说明
   - 更新架构模式和数据模型图

3. **README.md**：
   - 移除功能列表中的 provider-token
   - 更新截图（如有）
   - 移除相关环境变量说明（如有）

## Open Issues

### 需要用户确认

1. ✅ 是否需要数据导出功能？→ 用户确认：直接删除
2. ✅ 是否需要迁移向导？→ 用户确认：不需要
3. ✅ 是否分阶段执行？→ 用户确认：一次性完全移除

### 技术债务

- 考虑添加自动化测试以防止未来回归
- 考虑实现 API 版本控制以优雅处理功能移除

## Success Metrics

1. **代码度量**：
   - 删除的文件数：~10-15 个
   - 删除的代码行数：~1000-1500 行
   - 减少的数据库表：2 个

2. **功能度量**：
   - 所有 provider/token API 返回 404
   - 所有 groups/shares 功能正常工作
   - 构建和 lint 通过

3. **文档度量**：
   - 规范数量减少 1 个
   - 文档更新完成（CLAUDE.md, project.md）
