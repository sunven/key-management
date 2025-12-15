# group-management Specification

## Purpose
TBD - created by archiving change add-group-management. Update Purpose after archive.
## Requirements
### Requirement: Group 基础管理

系统 SHALL 允许用户创建、查看、编辑和删除 groups，每个 group 包含名称、描述和创建时间等基本信息。

#### Scenario: 创建新 group

- **WHEN** 用户点击 "添加 Group" 按钮
- **THEN** 打开 group 创建对话框
- **AND** 用户输入 group 名称（必填）和描述（可选）
- **AND** 提交后创建 group 并刷新列表

#### Scenario: 查看 groups 列表

- **WHEN** 用户导航到 `/groups` 页面
- **THEN** 显示当前用户拥有的所有 groups
- **AND** 每个 group 显示名称、描述、items 数量、创建时间和操作按钮
- **AND** 仅显示当前用户创建的 groups（用户隔离）

#### Scenario: 编辑 group 信息

- **WHEN** 用户点击 group 的 "编辑" 按钮
- **THEN** 打开编辑对话框，预填充当前的名称和描述
- **AND** 用户可以修改名称和描述
- **AND** 提交后更新 group 信息并刷新列表

#### Scenario: 删除 group

- **WHEN** 用户点击 group 的 "删除" 按钮
- **THEN** 显示确认对话框，提示将删除该 group 及其所有 items 和 tags
- **AND** 用户确认后删除 group
- **AND** 级联删除所有关联的 items 和 tags
- **AND** 刷新列表

### Requirement: Group Items 管理

系统 SHALL 允许用户在 group 内添加、查看、编辑和删除 key-value 对象，key 在同一 group 内必须唯一。

#### Scenario: 展开 group 查看 items

- **WHEN** 用户点击 group 行的展开图标
- **THEN** group 行展开，显示该 group 内所有 items 的列表
- **AND** 每个 item 显示 key、value、tags 和操作按钮
- **AND** 如果 group 内没有 items，显示空状态提示

#### Scenario: 在 group 内添加 item

- **WHEN** 用户在展开的 group 区域点击 "添加 Item" 按钮
- **THEN** 打开 item 创建对话框
- **AND** 用户输入 key（必填）和 value（必填）
- **AND** 用户可以添加多个 tags（可选）
- **AND** 系统验证 key 在该 group 内是否唯一
- **AND** 如果 key 重复，显示错误提示
- **AND** 提交成功后刷新该 group 的 items 列表

#### Scenario: 编辑 item

- **WHEN** 用户点击 item 的 "编辑" 按钮
- **THEN** 打开编辑对话框，预填充当前的 key、value 和 tags
- **AND** 用户可以修改 key、value 和 tags
- **AND** 系统验证修改后的 key 在该 group 内是否唯一（排除当前 item）
- **AND** 提交后更新 item 并刷新列表

#### Scenario: 删除 item

- **WHEN** 用户点击 item 的 "删除" 按钮
- **THEN** 显示确认对话框
- **AND** 用户确认后删除该 item
- **AND** 级联删除该 item 的所有 tags
- **AND** 刷新该 group 的 items 列表

#### Scenario: Key 唯一性验证

- **WHEN** 用户尝试创建或编辑 item 时输入的 key 已存在于该 group 中
- **THEN** 表单显示验证错误："该 key 已存在"
- **AND** 阻止表单提交
- **AND** 用户必须修改 key 才能继续

### Requirement: 标签系统

系统 SHALL 允许用户为每个 group item 添加多个自定义标签，并支持基于标签的过滤功能。

#### Scenario: 为 item 添加标签

- **WHEN** 用户在 item 创建或编辑对话框中添加标签
- **THEN** 使用标签输入组件（支持输入多个标签）
- **AND** 用户可以输入任意文本作为标签
- **AND** 标签以 badge 形式显示
- **AND** 用户可以点击 badge 上的删除图标移除标签

#### Scenario: 在列表中显示标签

- **WHEN** 用户查看展开的 group items 列表
- **THEN** 每个 item 的标签以 badge 形式显示在 tags 列
- **AND** 如果 item 没有标签，显示 "-" 或空状态
- **AND** 标签使用不同颜色或样式区分（可选）

#### Scenario: 按标签过滤 items

- **WHEN** 用户在展开的 group 区域选择一个或多个标签进行过滤
- **THEN** items 列表仅显示包含所选标签的 items
- **AND** 过滤条件显示在列表上方
- **AND** 用户可以清除过滤条件恢复显示所有 items

#### Scenario: 标签自动完成（可选增强）

- **WHEN** 用户在标签输入框中输入文本
- **THEN** 系统可以显示该 group 内已使用的标签建议
- **AND** 用户可以选择建议的标签或输入新标签
- **AND** 这是可选功能，不影响基本标签功能

### Requirement: 用户隔离和数据安全

系统 SHALL 确保 groups、items 和 tags 遵循严格的用户隔离原则，每个用户只能访问自己创建的数据。

#### Scenario: Group 列表用户隔离

- **WHEN** 用户访问 `/groups` 页面
- **THEN** 仅显示该用户创建的 groups
- **AND** 其他用户的 groups 不可见也不可访问
- **AND** API 查询使用 `where: { userId }` 过滤

#### Scenario: Group 操作权限验证

- **WHEN** 用户尝试编辑或删除一个 group
- **THEN** 系统验证该 group 属于当前用户
- **AND** 如果不属于当前用户，返回 404 错误（不泄露资源存在性）
- **AND** API 使用 `where: { id, userId }` 进行所有权检查

#### Scenario: Item 操作权限验证

- **WHEN** 用户尝试添加、编辑或删除 item
- **THEN** 系统首先验证该 item 所属的 group 属于当前用户
- **AND** 如果 group 不属于当前用户，返回 404 错误
- **AND** 确保用户不能操作其他用户的 items

#### Scenario: 级联删除

- **WHEN** 用户被删除（账户删除）
- **THEN** 该用户的所有 groups 被级联删除
- **AND** 所有关联的 items 和 tags 也被级联删除
- **AND** 数据库外键约束确保数据完整性

### Requirement: 导航和 UI 集成

系统 SHALL 在应用导航中添加 Groups 入口，并提供与现有 Provider-Token 管理一致的用户体验。

#### Scenario: 导航栏添加 Groups 链接

- **WHEN** 用户查看应用导航栏
- **THEN** 显示 "Dashboard"、"Providers" 和 "Groups" 三个链接
- **AND** 点击 "Groups" 导航到 `/groups` 页面
- **AND** 当前页面的导航项高亮显示

#### Scenario: Dashboard 快速访问

- **WHEN** 用户查看 Dashboard 页面
- **THEN** 显示 Groups 统计卡片（总数）
- **AND** 提供 "管理 Groups" 快速操作按钮
- **AND** 点击按钮导航到 `/groups` 页面

#### Scenario: 响应式布局

- **WHEN** 用户在不同设备上访问 Groups 页面
- **THEN** 页面布局适配移动端和桌面端
- **AND** 表格在移动端可以横向滚动或使用卡片布局
- **AND** 对话框和表单在移动端正常显示

### Requirement: 数据验证和错误处理

系统 SHALL 对所有 group、item 和 tag 操作进行严格的数据验证，并提供清晰的错误提示。

#### Scenario: Group 名称验证

- **WHEN** 用户创建或编辑 group 时
- **THEN** 名称字段为必填项
- **AND** 名称长度限制为 1-100 个字符
- **AND** 如果验证失败，显示内联错误提示

#### Scenario: Item key-value 验证

- **WHEN** 用户创建或编辑 item 时
- **THEN** key 和 value 字段都为必填项
- **AND** key 长度限制为 1-100 个字符
- **AND** value 长度限制为 1-5000 个字符
- **AND** key 必须在该 group 内唯一
- **AND** 如果验证失败，显示内联错误提示

#### Scenario: 标签验证

- **WHEN** 用户添加标签时
- **THEN** 单个标签长度限制为 1-50 个字符
- **AND** 一个 item 最多可以有 20 个标签
- **AND** 标签不能包含特殊字符（仅允许字母、数字、中文、连字符和下划线）
- **AND** 如果验证失败，显示错误提示

#### Scenario: API 错误处理

- **WHEN** API 操作失败（网络错误、服务器错误等）
- **THEN** 显示用户友好的错误消息
- **AND** 不暴露敏感的技术细节
- **AND** 提供重试或返回的操作选项

