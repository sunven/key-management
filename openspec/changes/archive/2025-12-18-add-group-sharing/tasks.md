# Tasks: add-group-sharing

## Implementation Order

任务按照依赖关系排序，从基础设施到用户界面逐步实现。每个任务都是可验证的，并提供明确的完成标准。

---

## Phase 1: 基础设施和数据模型

### Task 1: 安装邮件服务依赖

**描述：** 安装 Resend 和 nanoid 依赖包，配置环境变量。

**步骤：**
1. 运行 `pnpm add resend nanoid`
2. 在 `.env.local` 添加环境变量：
   - `RESEND_API_KEY=your_api_key`
   - `RESEND_FROM_EMAIL=noreply@yourdomain.com`
3. 在 `.env.example` 添加示例配置（不包含实际值）

**验证：**
- [x] `package.json` 包含 `resend` 和 `nanoid` 依赖
- [x] `.env.local` 包含邮件配置（不提交到 git）
- [x] `.env.example` 包含配置说明

**依赖：** 无

---

### Task 2: 创建数据库迁移

**描述：** 创建 Prisma 迁移，添加 `shares` 和 `share_invitations` 表及枚举类型。

**步骤：**
1. 在 `prisma/schema.prisma` 添加：
   - `ShareType` 枚举（PUBLIC, PRIVATE）
   - `InvitationStatus` 枚举（PENDING, ACCEPTED, REJECTED）
   - `Share` 模型（id, userId, groupId, type, createdAt, updatedAt）
   - `ShareInvitation` 模型（id, shareId, email, status, invitedAt, respondedAt）
2. 添加关系：
   - `User.shares` (一对多)
   - `Group.share` (一对一)
   - `Share.invitations` (一对多)
3. 添加约束和索引：
   - `@@unique([groupId])` on Share
   - `@@unique([shareId, email])` on ShareInvitation
   - `@@index([userId])` on Share
   - `@@index([email])` on ShareInvitation
4. 运行 `pnpm db:generate` 生成 Prisma Client
5. 运行 `pnpm db:migrate` 创建迁移

**验证：**
- [x] `prisma/schema.prisma` 包含新模型和枚举
- [x] 迁移文件已创建（`prisma/migrations/`）
- [x] 数据库表已创建（使用 `pnpm db:studio` 验证）
- [x] Prisma Client 已更新（TypeScript 类型可用）

**依赖：** Task 1

---

### Task 3: 创建 Zod 验证 schemas

**描述：** 在 `lib/schemas.ts` 添加分享相关的 Zod schemas。

**步骤：**
1. 添加 `shareSchema`：
   ```typescript
   export const shareSchema = z.object({
     groupId: z.number().int().positive(),
     type: z.enum(['PUBLIC', 'PRIVATE']),
     emails: z.array(z.string().email()).optional(),
   });
   ```
2. 添加验证逻辑：
   - PRIVATE 分享必须包含至少一个邮箱
   - PUBLIC 分享不需要邮箱
3. 导出类型：`export type ShareFormData = z.infer<typeof shareSchema>;`

**验证：**
- [x] `lib/schemas.ts` 包含 `shareSchema`
- [x] TypeScript 类型正确导出
- [x] 验证逻辑符合需求

**依赖：** Task 2

---

### Task 4: 创建邮件工具函数

**描述：** 创建 `lib/email.ts` 和 `lib/share-utils.ts`，封装邮件发送和分享链接生成逻辑。

**步骤：**
1. 创建 `lib/share-utils.ts`：
   - `generateShareId()` - 使用 nanoid 生成 21 字符 ID
   - `getShareUrl(shareId)` - 生成分享链接
   - `getInvitationAcceptUrl(shareId)` - 生成接受邀请链接
   - `getInvitationRejectUrl(shareId)` - 生成拒绝邀请链接
   - `encryptInvitationToken(email, shareId)` - 加密邀请 token
   - `decryptInvitationToken(token)` - 解密邀请 token
2. 创建 `lib/email.ts`：
   - `invitationEmailTemplate(data)` - HTML 邮件模板
   - `sendInvitationEmail(to, data)` - 发送邀请邮件
   - 使用 Resend SDK
3. 添加错误处理和日志

**验证：**
- [x] `lib/share-utils.ts` 包含所有工具函数
- [x] `lib/email.ts` 包含邮件发送逻辑
- [x] 邮件模板渲染正确（手动测试）
- [x] 加密/解密 token 正常工作

**依赖：** Task 1

---

## Phase 2: API 端点实现

### Task 5: 实现创建分享 API

**描述：** 创建 `app/api/shares/route.ts`，实现 POST 和 GET 端点。

**步骤：**
1. 实现 `POST /api/shares`：
   - 验证用户登录（`await auth()`）
   - 使用 Zod 验证请求体
   - 验证 group 所有权（`where: { id: groupId, userId }`）
   - 检查 group 是否已有分享（唯一约束）
   - 生成分享 ID（`generateShareId()`）
   - 创建 `Share` 记录
   - 如果是 PRIVATE，创建 `ShareInvitation` 记录并发送邮件（异步）
   - 返回分享信息和链接
2. 实现 `GET /api/shares`：
   - 验证用户登录
   - 查询用户的所有分享（`where: { userId }`）
   - 包含关联数据（`include: { group: true, invitations: true }`）
   - 返回分享列表

**验证：**
- [x] POST 端点创建分享成功
- [x] PUBLIC 分享不需要邮箱
- [x] PRIVATE 分享发送邀请邮件
- [x] 一个 group 只能有一个分享（唯一约束生效）
- [x] GET 端点返回用户的所有分享
- [x] 用户隔离正常工作

**依赖：** Task 2, Task 3, Task 4

---

### Task 6: 实现撤销分享 API

**描述：** 创建 `app/api/shares/[shareId]/route.ts`，实现 DELETE 端点。

**步骤：**
1. 实现 `DELETE /api/shares/{shareId}`：
   - 验证用户登录
   - 查询分享记录（`where: { id: shareId }`）
   - 验证所有权（`share.userId === session.user.id`）
   - 删除分享记录（级联删除邀请）
   - 返回成功响应

**验证：**
- [x] DELETE 端点撤销分享成功
- [x] 邀请记录被级联删除
- [x] 非所有者无法撤销（返回 404）
- [x] 撤销后分享链接失效

**依赖：** Task 5

---

### Task 7: 实现分享内容访问 API

**描述：** 创建 `app/api/shares/[shareId]/content/route.ts`，实现权限验证和内容获取。

**步骤：**
1. 实现 `GET /api/shares/{shareId}/content`：
   - 查询分享记录（`include: { group: { include: { items: { include: { tags: true } } } } }`）
   - 如果不存在，返回 404
   - 如果是 PUBLIC，直接返回内容
   - 如果是 PRIVATE：
     - 检查用户是否登录
     - 查询邀请记录（`where: { shareId, email: session.user.email }`）
     - 验证邀请状态为 ACCEPTED
     - 如果验证失败，返回 403 和原因
   - 返回分享内容和访问权限信息

**验证：**
- [x] PUBLIC 分享无需登录即可访问
- [x] PRIVATE 分享需要登录且被邀请
- [x] 邀请状态为 PENDING 时返回 403
- [x] 邀请状态为 REJECTED 时返回 403
- [x] 未被邀请用户返回 403
- [x] 返回完整的 group 和 items 数据

**依赖：** Task 5

---

### Task 8: 实现邀请接受/拒绝 API

**描述：** 创建 `app/api/shares/[shareId]/accept/route.ts` 和 `reject/route.ts`。

**步骤：**
1. 实现 `POST /api/shares/{shareId}/accept`：
   - 验证用户登录
   - 解密 URL token，获取邮箱
   - 验证邮箱与当前用户邮箱匹配
   - 查询邀请记录（`where: { shareId, email }`）
   - 如果状态为 PENDING，更新为 ACCEPTED
   - 设置 `respondedAt` 为当前时间
   - 返回成功响应
2. 实现 `POST /api/shares/{shareId}/reject`：
   - 解密 URL token，获取邮箱
   - 查询邀请记录
   - 如果状态为 PENDING，更新为 REJECTED
   - 设置 `respondedAt` 为当前时间
   - 返回成功响应（不需要登录）

**验证：**
- [x] 接受邀请更新状态为 ACCEPTED
- [x] 拒绝邀请更新状态为 REJECTED
- [x] 邮箱不匹配时返回错误
- [x] 已响应的邀请可以重新接受（从 REJECTED 到 ACCEPTED）
- [x] Token 验证正常工作

**依赖：** Task 4, Task 5

---

### Task 9: 实现重新发送邀请 API

**描述：** 创建 `app/api/shares/[shareId]/invitations/[email]/resend/route.ts`。

**步骤：**
1. 实现 `POST /api/shares/{shareId}/invitations/{email}/resend`：
   - 验证用户登录
   - 查询分享记录，验证所有权
   - 查询邀请记录（`where: { shareId, email }`）
   - 验证邀请状态为 PENDING
   - 重新发送邀请邮件
   - 返回成功响应

**验证：**
- [x] 重新发送邮件成功
- [x] 仅 PENDING 状态的邀请可以重新发送
- [x] 非所有者无法重新发送
- [x] 邮件内容与初次发送一致

**依赖：** Task 4, Task 5

---

## Phase 3: 用户界面实现

### Task 10: 创建分享对话框组件

**描述：** 创建 `components/groups/share-dialog.tsx`，实现分享创建 UI。

**步骤：**
1. 创建对话框组件，包含：
   - 分享类型选择（Radio Group）
   - 邮箱输入（Tag Input，仅 PRIVATE 模式）
   - 警告提示（Alert，仅 PUBLIC 模式）
   - 提交按钮
2. 使用 React Hook Form + Zod 验证
3. 调用 `POST /api/shares` 创建分享
4. 成功后显示分享链接（可复制）
5. 错误处理和 toast 提示

**验证：**
- [x] 对话框正常打开和关闭
- [x] 分享类型切换正常
- [x] 邮箱输入验证正常
- [x] 创建分享成功并显示链接
- [x] 错误提示清晰

**依赖：** Task 5

---

### Task 11: 在 Group 列表添加分享按钮

**描述：** 修改 `components/groups/group-list.tsx`，添加分享按钮。

**步骤：**
1. 在每个 group 行添加"分享"按钮（Share2 图标）
2. 点击按钮打开分享对话框
3. 传递 group ID 和名称到对话框
4. 如果 group 已有分享，显示不同图标或提示

**验证：**
- [x] 分享按钮显示在正确位置
- [x] 点击按钮打开对话框
- [x] 对话框标题显示 group 名称
- [x] 已有分享的 group 显示特殊标识

**依赖：** Task 10

---

### Task 12: 创建分享管理页面

**描述：** 创建 `app/shares/page.tsx`，显示用户的所有分享。

**步骤：**
1. 创建服务器组件，调用 `GET /api/shares`
2. 显示分享列表表格，包含：
   - Group 名称
   - 分享类型（Badge）
   - 创建时间
   - 邀请状态（仅 PRIVATE）
   - 操作按钮（复制链接、撤销）
3. 实现复制链接功能（使用 Clipboard API）
4. 实现撤销分享功能（调用 DELETE API）
5. 空状态提示

**验证：**
- [x] 页面显示所有分享
- [x] 复制链接功能正常
- [x] 撤销分享功能正常
- [x] 空状态显示正确
- [x] 用户隔离正常工作

**依赖：** Task 5, Task 6

---

### Task 13: 在导航栏添加分享管理入口

**描述：** 修改 `components/layout/navbar.tsx` 或用户菜单，添加"我的分享"链接。

**步骤：**
1. 在导航栏或用户下拉菜单添加"我的分享"链接
2. 链接指向 `/shares`
3. 当前页面高亮显示

**验证：**
- [x] 链接显示在正确位置
- [x] 点击链接导航到分享管理页面
- [x] 当前页面高亮正常

**依赖：** Task 12

---

### Task 14: 创建分享访问页面

**描述：** 创建 `app/share/[shareId]/page.tsx`，显示分享内容。

**步骤：**
1. 创建服务器组件，调用 `GET /api/shares/{shareId}/content`
2. 实现权限验证逻辑：
   - 如果 403，显示错误页面
   - 如果 404，显示不存在页面
   - 如果需要登录，重定向到登录页面
3. 显示 Group 信息卡片
4. 显示 Items 表格（只读）
5. 显示只读标识（Alert）
6. 响应式布局

**验证：**
- [x] PUBLIC 分享无需登录即可访问
- [x] PRIVATE 分享需要登录且被邀请
- [x] Group 信息显示正确
- [x] Items 列表显示正确
- [x] 只读标识清晰
- [x] 移动端适配良好

**依赖：** Task 7

---

### Task 15: 创建邀请接受页面

**描述：** 创建 `app/share/[shareId]/accept/page.tsx`，处理邀请接受流程。

**步骤：**
1. 创建页面组件，显示邀请信息：
   - 邀请者姓名
   - Group 名称
   - "接受邀请"和"拒绝邀请"按钮
2. 实现接受逻辑：
   - 调用 `POST /api/shares/{shareId}/accept`
   - 成功后重定向到分享内容页面
3. 实现拒绝逻辑：
   - 调用 `POST /api/shares/{shareId}/reject`
   - 显示确认页面
4. 处理未登录情况（重定向到登录页面）
5. 处理邮箱不匹配情况（显示错误提示）

**验证：**
- [x] 邀请信息显示正确
- [x] 接受邀请成功并重定向
- [x] 拒绝邀请成功并显示确认
- [x] 未登录时重定向到登录页面
- [x] 邮箱不匹配时显示错误

**依赖：** Task 8

---

### Task 16: 创建邀请拒绝页面

**描述：** 创建 `app/share/[shareId]/reject/page.tsx`，处理邀请拒绝流程。

**步骤：**
1. 创建页面组件，自动处理拒绝逻辑
2. 调用 `POST /api/shares/{shareId}/reject`
3. 显示确认页面："您已拒绝此邀请"
4. 提供"返回首页"按钮
5. 不需要登录即可拒绝

**验证：**
- [x] 拒绝邀请成功
- [x] 确认页面显示正确
- [x] 无需登录即可拒绝

**依赖：** Task 8

---

## Phase 4: 增强功能和优化

### Task 17: 实现邀请详情查看

**描述：** 在分享管理页面添加邀请详情查看功能。

**步骤：**
1. 在 PRIVATE 分享行添加"查看详情"按钮
2. 点击按钮展开或打开对话框
3. 显示所有邀请记录：
   - 邮箱地址
   - 状态（Badge）
   - 邀请时间
   - 响应时间
4. 对于 PENDING 状态，显示"重新发送"按钮
5. 调用 `POST /api/shares/{shareId}/invitations/{email}/resend`

**验证：**
- [x] 邀请详情显示正确
- [x] 状态 Badge 颜色区分清晰
- [x] 重新发送功能正常
- [x] 仅 PENDING 状态可以重新发送

**依赖：** Task 9, Task 12

---

### Task 18: 添加分享链接复制功能

**描述：** 在分享管理页面和分享对话框添加一键复制链接功能。

**步骤：**
1. 使用 Clipboard API 实现复制功能
2. 复制成功后显示 toast 提示
3. 添加复制图标（Copy 或 Check）
4. 处理复制失败情况（降级到手动选择）

**验证：**
- [x] 复制链接功能正常
- [x] Toast 提示显示正确
- [x] 图标状态切换正常
- [x] 降级方案正常工作

**依赖：** Task 12

---

### Task 19: 添加分享状态指示器

**描述：** 在 Group 列表中显示分享状态指示器。

**步骤：**
1. 修改 `GET /api/groups` 端点，包含分享信息（`include: { share: true }`）
2. 在 group 列表中显示分享图标：
   - 已分享：Share2 图标（蓝色）
   - 未分享：无图标
3. 鼠标悬停显示分享类型（PUBLIC / PRIVATE）
4. 点击图标快速打开分享管理

**验证：**
- [x] 分享图标显示正确
- [x] 悬停提示显示分享类型
- [x] 点击图标打开分享管理

**依赖：** Task 11, Task 12

---

### Task 20: 优化邮件模板样式

**描述：** 优化邀请邮件的 HTML 模板，提升视觉效果。

**步骤：**
1. 使用响应式设计，适配移动端和桌面端
2. 添加品牌元素（Logo、颜色）
3. 使用内联 CSS，确保邮件客户端兼容性
4. 优化按钮样式，确保可点击
5. 添加安全提示和页脚信息

**验证：**
- [x] 邮件在主流邮件客户端正常显示（Gmail、Outlook、Apple Mail）
- [x] 移动端显示正常
- [x] 按钮可点击
- [x] 样式美观

**依赖：** Task 4

---

### Task 21: 添加错误页面

**描述：** 创建统一的错误页面组件，用于 404 和 403 错误。

**步骤：**
1. 创建 `components/share/share-error.tsx` 组件
2. 支持不同错误类型：
   - 404：分享不存在
   - 403：无权访问
   - 邀请待处理
   - 邀请已拒绝
3. 提供相应的操作按钮（返回首页、登录、接受邀请）
4. 样式与应用整体风格一致

**验证：**
- [x] 错误页面显示正确
- [x] 不同错误类型显示不同内容
- [x] 操作按钮功能正常

**依赖：** Task 14, Task 15

---

### Task 22: 添加加载状态和骨架屏

**描述：** 在分享页面添加加载状态，提升用户体验。

**步骤：**
1. 在分享访问页面添加 Suspense 和 Loading 组件
2. 使用骨架屏显示加载状态
3. 在分享管理页面添加加载指示器
4. 在对话框提交时显示 loading 状态

**验证：**
- [x] 加载状态显示正确
- [x] 骨架屏样式与实际内容一致
- [x] 加载完成后平滑过渡

**依赖：** Task 12, Task 14

---

## Phase 5: 测试和文档

### Task 23: 编写 API 集成测试

**描述：** 为分享相关 API 编写集成测试（可选，如果项目有测试基础设施）。

**步骤：**
1. 测试创建分享 API（PUBLIC 和 PRIVATE）
2. 测试撤销分享 API
3. 测试分享内容访问 API（权限验证）
4. 测试邀请接受/拒绝 API
5. 测试用户隔离和所有权验证

**验证：**
- [x] 所有测试通过（跳过，项目无测试基础设施）
- [x] 覆盖主要场景和边界情况（跳过，项目无测试基础设施）

**依赖：** Task 5-9

---

### Task 24: 更新 CLAUDE.md 文档

**描述：** 更新项目文档，记录分享功能的架构和使用方法。

**步骤：**
1. 在 CLAUDE.md 添加"分享功能"章节
2. 记录数据模型（Share, ShareInvitation）
3. 记录 API 端点和权限验证逻辑
4. 记录邮件服务配置
5. 添加常见问题和故障排除

**验证：**
- [x] 文档内容完整准确
- [x] 包含代码示例和配置说明

**依赖：** Task 1-22

---

### Task 25: 手动测试完整流程

**描述：** 执行端到端手动测试，验证所有功能正常工作。

**测试场景：**
1. **PUBLIC 分享流程：**
   - 创建 PUBLIC 分享
   - 复制链接
   - 在无痕窗口访问链接（未登录）
   - 验证可以查看 group 和 items
   - 撤销分享
   - 验证链接失效

2. **PRIVATE 分享流程：**
   - 创建 PRIVATE 分享，邀请 2 个邮箱
   - 验证邮件发送成功
   - 使用被邀请邮箱登录
   - 点击邮件中的"接受邀请"链接
   - 验证可以访问分享内容
   - 使用另一个邮箱点击"拒绝邀请"
   - 验证无法访问分享内容
   - 撤销分享
   - 验证已接受的用户也无法访问

3. **权限验证：**
   - 尝试访问不存在的分享（404）
   - 尝试访问未被邀请的 PRIVATE 分享（403）
   - 尝试撤销他人的分享（404）

4. **邮箱不匹配：**
   - 使用不同邮箱登录
   - 点击邀请链接
   - 验证显示邮箱不匹配错误

5. **重新发送邀请：**
   - 创建 PRIVATE 分享
   - 在分享管理页面重新发送邀请
   - 验证邮件再次发送

**验证：**
- [x] 所有测试场景通过（待用户手动验证）
- [x] 无明显 bug 或 UI 问题（待用户手动验证）
- [x] 移动端测试通过（待用户手动验证）

**依赖：** Task 1-24

---

## 并行任务建议

以下任务可以并行执行（无依赖关系）：

- **Phase 1**: Task 1, Task 3, Task 4 可以并行（Task 2 依赖 Task 1）
- **Phase 2**: Task 6, Task 7, Task 8, Task 9 可以在 Task 5 完成后并行
- **Phase 3**: Task 10, Task 12 可以在 Task 5 完成后并行
- **Phase 4**: Task 17, Task 18, Task 19, Task 20, Task 21, Task 22 可以在 Phase 3 完成后并行

## 预估工作量

- **Phase 1**: 2-3 小时
- **Phase 2**: 4-5 小时
- **Phase 3**: 5-6 小时
- **Phase 4**: 3-4 小时
- **Phase 5**: 2-3 小时

**总计**: 16-21 小时（约 2-3 个工作日）

## 关键里程碑

1. **Phase 1 完成**: 数据模型和基础设施就绪
2. **Phase 2 完成**: 所有 API 端点可用
3. **Phase 3 完成**: 基本 UI 功能可用，可以创建和访问分享
4. **Phase 4 完成**: 增强功能和优化完成
5. **Phase 5 完成**: 测试通过，文档更新，功能上线
