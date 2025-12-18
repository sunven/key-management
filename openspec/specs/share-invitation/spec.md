# share-invitation Specification

## Purpose

提供分享邀请系统，支持通过邮件邀请特定用户访问 PRIVATE 分享。管理邀请状态（待处理、已接受、已拒绝），并提供邀请响应流程。

## Requirements

### Requirement: 邀请数据模型

系统 SHALL 在数据库中创建 `share_invitations` 表和相关枚举类型，记录邀请信息和状态。

#### Scenario: ShareInvitation 表结构

- **GIVEN** 数据库迁移已执行
- **THEN** `share_invitations` 表包含以下字段：
  - `id` (SERIAL, PRIMARY KEY) - 邀请 ID
  - `share_id` (TEXT, NOT NULL, FK to shares) - 关联的分享
  - `email` (TEXT, NOT NULL) - 被邀请用户邮箱
  - `status` (InvitationStatus ENUM, NOT NULL, DEFAULT PENDING) - 邀请状态
  - `invited_at` (TIMESTAMP, NOT NULL, DEFAULT now()) - 邀请时间
  - `responded_at` (TIMESTAMP, NULLABLE) - 响应时间
- **AND** 存在唯一约束：`UNIQUE(share_id, email)` - 同一分享不能重复邀请同一邮箱
- **AND** 存在索引：`INDEX(email)` - 加速按邮箱查询
- **AND** 外键约束：
  - `share_id` REFERENCES `shares(id)` ON DELETE CASCADE

#### Scenario: InvitationStatus 枚举

- **GIVEN** 数据库迁移已执行
- **THEN** 存在 `InvitationStatus` 枚举类型，包含以下值：
  - `PENDING` - 待处理（默认状态）
  - `ACCEPTED` - 已接受
  - `REJECTED` - 已拒绝

#### Scenario: 级联删除 - 分享删除

- **GIVEN** 某个分享有多个邀请记录
- **WHEN** 该分享被撤销（删除）
- **THEN** 所有关联的 `ShareInvitation` 记录被级联删除
- **AND** 数据库外键约束确保数据完整性

### Requirement: 发送邀请邮件

系统 SHALL 在创建 PRIVATE 分享时向所有邀请邮箱发送邀请邮件，包含接受和拒绝链接。

#### Scenario: 邮件内容

- **GIVEN** 用户创建了 PRIVATE 分享并邀请了某个邮箱
- **WHEN** 系统发送邀请邮件
- **THEN** 邮件包含以下内容：
  - 主题："[邀请者姓名] 邀请您查看 Group: [Group 名称]"
  - 邀请者信息：姓名和邮箱
  - Group 名称
  - 说明："这是一个只读分享，您可以查看该 Group 中的所有配置项"
  - "接受邀请"按钮（链接到 `/share/{shareId}/accept`）
  - "拒绝邀请"按钮（链接到 `/share/{shareId}/reject`）
  - 安全提示："如果您不认识邀请者，请忽略此邮件或点击'拒绝邀请'"
  - 页脚："此邮件由 Key Management 系统自动发送"
- **AND** 邮件使用 HTML 格式，样式美观易读

#### Scenario: 批量发送邮件

- **GIVEN** 用户创建 PRIVATE 分享并邀请了多个邮箱（如 5 个）
- **WHEN** 系统处理邀请
- **THEN** 为每个邮箱创建 `ShareInvitation` 记录
- **AND** 异步发送邮件到每个邮箱（不阻塞 API 响应）
- **AND** 如果某个邮件发送失败，记录错误日志但不影响其他邮件
- **AND** API 响应包含所有邀请记录（状态为 PENDING）

#### Scenario: 邮件发送失败处理

- **GIVEN** 系统尝试发送邀请邮件
- **WHEN** 邮件服务返回错误（如邮箱不存在、服务不可用）
- **THEN** 系统记录错误日志，包含邮箱地址和错误信息
- **AND** 邀请记录仍然创建（状态为 PENDING）
- **AND** 用户可以稍后使用"重新发送"功能重试
- **AND** 不向用户显示技术错误细节，仅提示："部分邮件可能发送失败，请稍后重试"

### Requirement: 接受邀请

系统 SHALL 允许被邀请用户通过邮件链接接受邀请，接受后可以访问分享内容。

#### Scenario: 点击接受链接（已登录）

- **GIVEN** 用户收到邀请邮件
- **AND** 用户已登录，且登录邮箱与被邀请邮箱一致
- **WHEN** 用户点击邮件中的"接受邀请"链接
- **THEN** 浏览器打开 `/share/{shareId}/accept` 页面
- **AND** 系统验证当前用户邮箱与邀请邮箱是否匹配
- **AND** 系统查询该邀请记录（`where: { shareId, email }`）
- **AND** 如果邀请状态为 PENDING，更新为 ACCEPTED
- **AND** 设置 `responded_at` 为当前时间
- **AND** 自动重定向到分享内容页面（`/share/{shareId}`）
- **AND** 显示成功提示："您已成功接受邀请"

#### Scenario: 点击接受链接（未登录）

- **GIVEN** 用户收到邀请邮件
- **AND** 用户未登录
- **WHEN** 用户点击邮件中的"接受邀请"链接
- **THEN** 浏览器打开 `/share/{shareId}/accept` 页面
- **AND** 系统检测到用户未登录
- **AND** 重定向到登录页面（`/auth/signin?callbackUrl=/share/{shareId}/accept`）
- **AND** 用户登录后自动返回接受页面
- **AND** 继续执行接受邀请流程

#### Scenario: 邮箱不匹配

- **GIVEN** 用户收到邀请邮件（邀请邮箱为 user@example.com）
- **AND** 用户使用不同邮箱登录（如 other@example.com）
- **WHEN** 用户点击"接受邀请"链接
- **THEN** 系统验证当前用户邮箱与邀请邮箱不匹配
- **AND** 显示错误页面："此邀请是发送给 user@example.com 的，请使用该邮箱登录"
- **AND** 提供"切换账户"按钮（退出登录并重定向到登录页面）

#### Scenario: 邀请已被响应

- **GIVEN** 用户已接受或拒绝某个邀请
- **WHEN** 用户再次点击邀请链接
- **THEN** 系统检测到邀请状态不是 PENDING
- **AND** 如果状态为 ACCEPTED，显示："您已接受此邀请"，并提供"查看分享"按钮
- **AND** 如果状态为 REJECTED，显示："您已拒绝此邀请"，并提供"重新接受"选项（更新状态为 ACCEPTED）

#### Scenario: 邀请不存在

- **GIVEN** 用户点击某个邀请链接
- **WHEN** 系统查询邀请记录，返回 null（分享已撤销或邀请不存在）
- **THEN** 显示 404 页面："邀请不存在或已被撤销"
- **AND** 不泄露分享或邀请曾经存在的信息

### Requirement: 拒绝邀请

系统 SHALL 允许被邀请用户通过邮件链接拒绝邀请，拒绝后无法访问分享内容。

#### Scenario: 点击拒绝链接

- **GIVEN** 用户收到邀请邮件
- **WHEN** 用户点击邮件中的"拒绝邀请"链接
- **THEN** 浏览器打开 `/share/{shareId}/reject` 页面
- **AND** 系统查询该邀请记录（`where: { shareId, email }`）
- **AND** 如果邀请状态为 PENDING，更新为 REJECTED
- **AND** 设置 `responded_at` 为当前时间
- **AND** 显示确认页面："您已拒绝此邀请"
- **AND** 提供"返回首页"按钮

#### Scenario: 拒绝邀请不需要登录

- **GIVEN** 用户收到邀请邮件
- **AND** 用户未登录
- **WHEN** 用户点击"拒绝邀请"链接
- **THEN** 系统直接处理拒绝操作（不要求登录）
- **AND** 通过邮件地址识别邀请（从 URL 参数或 token 中获取）
- **AND** 更新邀请状态为 REJECTED
- **AND** 显示确认页面

#### Scenario: 拒绝后重新接受

- **GIVEN** 用户已拒绝某个邀请
- **WHEN** 用户改变主意，再次点击"接受邀请"链接
- **THEN** 系统检测到邀请状态为 REJECTED
- **AND** 显示确认对话框："您之前已拒绝此邀请，确定要重新接受吗？"
- **AND** 用户确认后，更新状态为 ACCEPTED
- **AND** 更新 `responded_at` 为当前时间
- **AND** 重定向到分享内容页面

### Requirement: 邀请链接安全

系统 SHALL 确保邀请链接的安全性，防止伪造和未授权访问。

#### Scenario: 邀请链接包含验证信息

- **GIVEN** 系统生成邀请链接
- **THEN** 链接格式为：`/share/{shareId}/accept?token={encryptedToken}`
- **AND** `encryptedToken` 包含加密的邮箱地址和时间戳
- **AND** 使用服务器端密钥加密（`AUTH_SECRET`）
- **AND** 链接不可预测，防止枚举攻击

#### Scenario: 验证 token 有效性

- **GIVEN** 用户点击邀请链接
- **WHEN** 系统处理接受/拒绝请求
- **THEN** 解密 URL 中的 token
- **AND** 验证 token 中的邮箱与邀请记录的邮箱是否匹配
- **AND** 验证 token 是否过期（可选：设置 7 天有效期）
- **AND** 如果验证失败，返回 403 错误："链接无效或已过期"

#### Scenario: 防止重放攻击

- **GIVEN** 用户已接受邀请
- **WHEN** 攻击者尝试使用相同的链接再次接受
- **THEN** 系统检测到邀请状态已为 ACCEPTED
- **AND** 不执行任何操作，仅显示"您已接受此邀请"
- **AND** 不泄露敏感信息

### Requirement: 邮件服务集成

系统 SHALL 集成邮件发送服务（Resend），提供可靠的邮件发送能力。

#### Scenario: 配置 Resend

- **GIVEN** 开发者设置环境变量
- **THEN** `.env.local` 包含以下变量：
  - `RESEND_API_KEY` - Resend API 密钥
  - `RESEND_FROM_EMAIL` - 发件人邮箱（如 noreply@yourdomain.com）
- **AND** 安装 `resend` npm 包（`pnpm add resend`）
- **AND** 创建 `lib/email.ts` 封装邮件发送逻辑

#### Scenario: 邮件发送函数

- **GIVEN** 系统需要发送邀请邮件
- **THEN** 调用 `sendInvitationEmail(to, data)` 函数
- **AND** 函数参数包含：
  - `to` - 收件人邮箱
  - `data` - 邮件数据（邀请者姓名、Group 名称、接受/拒绝链接）
- **AND** 函数使用 Resend SDK 发送邮件
- **AND** 返回 Promise，成功时 resolve，失败时 reject
- **AND** 错误信息包含详细的失败原因（用于日志）

#### Scenario: 邮件模板

- **GIVEN** 系统需要渲染邮件内容
- **THEN** 使用 HTML 模板（`invitationEmailTemplate(data)`）
- **AND** 模板包含响应式设计，适配移动端和桌面端
- **AND** 模板使用内联 CSS，确保邮件客户端兼容性
- **AND** 模板包含品牌元素（Logo、颜色）
- **AND** 按钮使用 `<a>` 标签，确保可点击

#### Scenario: 邮件发送限流

- **GIVEN** Resend 免费额度为 100 封/天
- **WHEN** 用户尝试发送大量邀请（如 50 个邮箱）
- **THEN** 系统检查当日已发送邮件数量
- **AND** 如果接近限额，显示警告："今日邮件发送接近限额，请明天再试"
- **AND** 阻止发送操作
- **AND** 建议用户升级邮件服务或分批发送

### Requirement: 邀请状态管理

系统 SHALL 提供邀请状态的查询和管理功能，供分享创建者查看。

#### Scenario: 查看邀请列表

- **GIVEN** 用户创建了 PRIVATE 分享
- **WHEN** 用户在分享管理页面查看该分享
- **THEN** 显示所有邀请记录，包含：
  - 邮箱地址
  - 状态（待处理 / 已接受 / 已拒绝）
  - 邀请时间
  - 响应时间（如果已响应）
- **AND** 使用不同颜色或图标区分状态：
  - 待处理：黄色 / Clock 图标
  - 已接受：绿色 / Check 图标
  - 已拒绝：红色 / X 图标

#### Scenario: 统计邀请状态

- **GIVEN** 用户在分享列表页面
- **WHEN** 用户查看 PRIVATE 分享
- **THEN** 显示邀请统计："已接受 {acceptedCount} / {totalCount}"
- **AND** 计算逻辑：
  - `acceptedCount` = 状态为 ACCEPTED 的邀请数量
  - `totalCount` = 所有邀请数量
- **AND** 如果所有邀请都已接受，显示绿色勾选图标

#### Scenario: 过滤邀请状态

- **GIVEN** 用户在邀请详情页面
- **WHEN** 用户选择状态过滤器（如"仅显示待处理"）
- **THEN** 邀请列表仅显示匹配状态的记录
- **AND** 提供"全部"、"待处理"、"已接受"、"已拒绝"四个选项
- **AND** 默认显示"全部"
