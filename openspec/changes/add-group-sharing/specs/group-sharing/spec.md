# group-sharing Specification

## Purpose

提供 Group 分享的核心功能，允许用户创建、管理和撤销分享。支持两种分享模式：PUBLIC（公开访问）和 PRIVATE（邀请访问）。确保分享操作的安全性和用户隔离。

## ADDED Requirements

### Requirement: 创建分享

系统 SHALL 允许用户为自己拥有的 group 创建分享，支持 PUBLIC 和 PRIVATE 两种模式。

#### Scenario: 创建 PUBLIC 分享

- **GIVEN** 用户已登录且拥有至少一个 group
- **WHEN** 用户选择一个 group 并点击"分享"按钮
- **AND** 在分享对话框中选择"公开分享"模式
- **AND** 点击"创建分享"按钮
- **THEN** 系统生成唯一的分享 ID（使用 nanoid，21 字符）
- **AND** 在数据库中创建 `Share` 记录，类型为 PUBLIC
- **AND** 返回分享链接（格式：`/share/{shareId}`）
- **AND** 显示成功提示和可复制的分享链接
- **AND** 显示警告："公开分享链接可能被任何人访问，请勿分享敏感数据"

#### Scenario: 创建 PRIVATE 分享

- **GIVEN** 用户已登录且拥有至少一个 group
- **WHEN** 用户选择一个 group 并点击"分享"按钮
- **AND** 在分享对话框中选择"私密分享"模式
- **AND** 输入一个或多个邀请邮箱地址（逗号分隔或标签输入）
- **AND** 点击"创建分享"按钮
- **THEN** 系统验证所有邮箱格式是否有效
- **AND** 生成唯一的分享 ID
- **AND** 在数据库中创建 `Share` 记录，类型为 PRIVATE
- **AND** 为每个邮箱创建 `ShareInvitation` 记录，状态为 PENDING
- **AND** 向每个邮箱发送邀请邮件（异步）
- **AND** 返回分享链接和邀请列表
- **AND** 显示成功提示："已向 {N} 个邮箱发送邀请"

#### Scenario: 一个 group 只能有一个活跃分享

- **GIVEN** 用户已为某个 group 创建了分享
- **WHEN** 用户尝试为同一个 group 再次创建分享
- **THEN** 系统返回错误："该 Group 已有活跃分享，请先撤销现有分享"
- **AND** 提供"查看现有分享"的快捷链接
- **AND** 阻止创建新分享

#### Scenario: 验证 group 所有权

- **GIVEN** 用户已登录
- **WHEN** 用户尝试为某个 group 创建分享
- **THEN** 系统验证该 group 的 `userId` 是否等于当前用户 ID
- **AND** 如果不匹配，返回 404 错误（不泄露 group 存在性）
- **AND** 如果匹配，允许创建分享

#### Scenario: 邮箱格式验证

- **GIVEN** 用户正在创建 PRIVATE 分享
- **WHEN** 用户输入邮箱地址
- **THEN** 系统验证每个邮箱格式是否符合标准（使用 Zod email 验证）
- **AND** 如果有无效邮箱，显示错误："邮箱格式无效：{email}"
- **AND** 阻止表单提交
- **AND** 用户必须修正邮箱才能继续

### Requirement: 查看分享列表

系统 SHALL 允许用户查看自己创建的所有分享，包括分享类型、关联的 group、创建时间和邀请状态。

#### Scenario: 显示用户的所有分享

- **GIVEN** 用户已登录
- **WHEN** 用户访问 `/shares` 页面
- **THEN** 系统查询该用户创建的所有 `Share` 记录（`where: { userId }`）
- **AND** 包含关联的 group 信息（`include: { group: true }`）
- **AND** 对于 PRIVATE 分享，包含邀请列表（`include: { invitations: true }`）
- **AND** 显示表格，包含以下列：
  - Group 名称
  - 分享类型（PUBLIC / PRIVATE）
  - 创建时间
  - 邀请状态（仅 PRIVATE，显示"已接受 / 总数"）
  - 操作按钮（复制链接、撤销）
- **AND** 如果没有分享，显示空状态："您还没有创建任何分享"

#### Scenario: 复制分享链接

- **GIVEN** 用户在分享列表页面
- **WHEN** 用户点击某个分享的"复制链接"按钮
- **THEN** 系统生成完整的分享 URL（`{baseUrl}/share/{shareId}`）
- **AND** 将 URL 复制到剪贴板
- **AND** 显示成功提示："分享链接已复制"

#### Scenario: 查看邀请详情（PRIVATE 分享）

- **GIVEN** 用户在分享列表页面
- **AND** 某个分享类型为 PRIVATE
- **WHEN** 用户点击该分享的"查看详情"按钮
- **THEN** 展开或打开对话框，显示所有邀请记录
- **AND** 每个邀请显示：
  - 邮箱地址
  - 状态（待处理 / 已接受 / 已拒绝）
  - 邀请时间
  - 响应时间（如果已响应）
- **AND** 对于待处理的邀请，提供"重新发送邮件"按钮

### Requirement: 撤销分享

系统 SHALL 允许用户撤销自己创建的分享，撤销后分享链接立即失效，所有邀请也被删除。

#### Scenario: 撤销分享

- **GIVEN** 用户已登录且拥有至少一个分享
- **WHEN** 用户在分享列表页面点击某个分享的"撤销"按钮
- **THEN** 显示确认对话框："确定要撤销此分享吗？撤销后链接将立即失效，所有被邀请用户将失去访问权限。"
- **AND** 用户点击"确认"后
- **THEN** 系统验证该分享属于当前用户（`where: { id, userId }`）
- **AND** 删除 `Share` 记录
- **AND** 级联删除所有关联的 `ShareInvitation` 记录（数据库外键约束）
- **AND** 刷新分享列表
- **AND** 显示成功提示："分享已撤销"

#### Scenario: 撤销后访问失效

- **GIVEN** 某个分享已被撤销
- **WHEN** 任何用户尝试访问该分享链接（`/share/{shareId}`）
- **THEN** 系统查询 `Share` 记录，返回 null
- **AND** 显示 404 页面："分享不存在或已被撤销"
- **AND** 不泄露分享曾经存在的信息

#### Scenario: 验证撤销权限

- **GIVEN** 用户已登录
- **WHEN** 用户尝试撤销某个分享
- **THEN** 系统验证该分享的 `userId` 是否等于当前用户 ID
- **AND** 如果不匹配，返回 404 错误（不泄露分享存在性）
- **AND** 如果匹配，允许撤销

### Requirement: 重新发送邀请邮件

系统 SHALL 允许用户为待处理的邀请重新发送邮件，用于邮件丢失或用户未收到的情况。

#### Scenario: 重新发送邀请

- **GIVEN** 用户已登录且拥有一个 PRIVATE 分享
- **AND** 该分享有至少一个状态为 PENDING 的邀请
- **WHEN** 用户在邀请详情中点击某个邀请的"重新发送"按钮
- **THEN** 系统验证该邀请属于当前用户的分享
- **AND** 验证邀请状态为 PENDING（已接受或已拒绝的邀请不能重新发送）
- **AND** 重新发送邀请邮件（使用相同的邮件模板）
- **AND** 显示成功提示："邀请邮件已重新发送至 {email}"

#### Scenario: 不能重新发送已响应的邀请

- **GIVEN** 用户已登录且拥有一个 PRIVATE 分享
- **AND** 该分享有一个状态为 ACCEPTED 或 REJECTED 的邀请
- **WHEN** 用户尝试重新发送该邀请
- **THEN** 系统返回错误："该邀请已被响应，无法重新发送"
- **AND** 阻止重新发送操作

### Requirement: 分享数据模型

系统 SHALL 在数据库中创建 `shares` 表和相关枚举类型，确保数据完整性和级联删除。

#### Scenario: Share 表结构

- **GIVEN** 数据库迁移已执行
- **THEN** `shares` 表包含以下字段：
  - `id` (TEXT, PRIMARY KEY) - 分享 ID，使用 nanoid 生成
  - `user_id` (INTEGER, NOT NULL, FK to users) - 分享创建者
  - `group_id` (INTEGER, NOT NULL, FK to groups) - 被分享的 group
  - `type` (ShareType ENUM, NOT NULL) - 分享类型（PUBLIC / PRIVATE）
  - `created_at` (TIMESTAMP, NOT NULL, DEFAULT now()) - 创建时间
  - `updated_at` (TIMESTAMP, NOT NULL) - 更新时间
- **AND** 存在唯一约束：`UNIQUE(group_id)` - 一个 group 只能有一个活跃分享
- **AND** 存在索引：`INDEX(user_id)` - 加速按用户查询
- **AND** 外键约束：
  - `user_id` REFERENCES `users(id)` ON DELETE CASCADE
  - `group_id` REFERENCES `groups(id)` ON DELETE CASCADE

#### Scenario: ShareType 枚举

- **GIVEN** 数据库迁移已执行
- **THEN** 存在 `ShareType` 枚举类型，包含以下值：
  - `PUBLIC` - 公开分享
  - `PRIVATE` - 私密分享

#### Scenario: 级联删除 - 用户删除

- **GIVEN** 某个用户创建了多个分享
- **WHEN** 该用户被删除（账户删除）
- **THEN** 该用户的所有 `Share` 记录被级联删除
- **AND** 所有关联的 `ShareInvitation` 记录也被级联删除
- **AND** 数据库外键约束确保数据完整性

#### Scenario: 级联删除 - Group 删除

- **GIVEN** 某个 group 有一个活跃分享
- **WHEN** 该 group 被删除
- **THEN** 关联的 `Share` 记录被级联删除
- **AND** 所有关联的 `ShareInvitation` 记录也被级联删除
- **AND** 分享链接立即失效

### Requirement: 分享 UI 集成

系统 SHALL 在 group 管理界面添加分享入口，并提供独立的分享管理页面。

#### Scenario: Group 列表添加分享按钮

- **GIVEN** 用户在 `/groups` 页面
- **WHEN** 用户查看 group 列表
- **THEN** 每个 group 行显示"分享"按钮（图标：Share2）
- **AND** 点击按钮打开分享创建对话框
- **AND** 对话框标题显示："分享 Group: {groupName}"

#### Scenario: 导航栏添加分享管理入口

- **GIVEN** 用户已登录
- **WHEN** 用户查看应用导航栏
- **THEN** 显示"我的分享"链接（或在用户菜单中）
- **AND** 点击链接导航到 `/shares` 页面
- **AND** 当前页面的导航项高亮显示

#### Scenario: 分享对话框 UI

- **GIVEN** 用户打开分享创建对话框
- **THEN** 对话框包含以下元素：
  - 标题："分享 Group: {groupName}"
  - 分享类型选择（单选按钮）：
    - 公开分享（说明：任何人都可以通过链接访问）
    - 私密分享（说明：仅邀请的用户可以访问）
  - 邮箱输入框（仅 PRIVATE 模式显示）
  - 警告提示（仅 PUBLIC 模式显示）："公开分享链接可能被任何人访问，请勿分享敏感数据"
  - 操作按钮："取消"、"创建分享"
- **AND** 对话框样式与现有 provider/token 对话框一致

#### Scenario: 分享成功后显示链接

- **GIVEN** 用户成功创建分享
- **THEN** 对话框内容切换为成功状态
- **AND** 显示分享链接（可点击复制）
- **AND** 对于 PRIVATE 分享，显示："已向 {N} 个邮箱发送邀请"
- **AND** 提供"关闭"按钮
- **AND** 关闭对话框后刷新 group 列表（可选：显示分享图标）
