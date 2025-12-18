# Internationalization (i18n) 规格

## ADDED Requirements

### Requirement: 多语言翻译支持

系统 SHALL 支持中文（zh）和英文（en）两种语言的用户界面翻译。

#### Scenario: 英文界面显示

- **WHEN** 用户语言偏好设置为英文（en）
- **THEN** 所有 UI 文本 SHALL 以英文显示
- **AND** 保持应用的视觉风格（大写下划线格式如 `INIT_NEW_GROUP`）

#### Scenario: 中文界面显示

- **WHEN** 用户语言偏好设置为中文（zh）
- **THEN** 所有 UI 文本 SHALL 以中文显示
- **AND** 保持应用的视觉风格一致性

#### Scenario: 翻译覆盖范围

- **WHEN** 应用加载时
- **THEN** 以下内容 SHALL 根据用户语言偏好显示对应翻译：
  - 导航栏链接和标题
  - 页面标题和描述
  - 按钮文本
  - 表单标签和占位符
  - 对话框标题和内容
  - 表格列标题
  - 空状态消息
  - 加载状态文本
  - Toast 通知消息
  - 验证错误消息

### Requirement: 语言切换功能

系统 SHALL 提供用户界面允许用户在支持的语言之间切换。

#### Scenario: 语言切换入口

- **WHEN** 用户打开用户菜单
- **THEN** SHALL 显示语言切换选项
- **AND** 当前选中的语言 SHALL 有视觉标识

#### Scenario: 切换语言

- **WHEN** 用户在语言菜单中选择不同的语言
- **THEN** 页面内容 SHALL 立即更新为所选语言
- **AND** 页面 SHALL NOT 完全刷新（客户端切换）

#### Scenario: 语言切换即时生效

- **WHEN** 用户切换语言
- **THEN** 所有可见的 UI 文本 SHALL 立即更新
- **AND** SHALL NOT 出现语言混合显示

### Requirement: 语言偏好持久化

系统 SHALL 持久化用户的语言偏好设置。

#### Scenario: 保存语言偏好

- **WHEN** 用户切换语言
- **THEN** 语言偏好 SHALL 保存到 cookie（键名：`NEXT_LOCALE`）
- **AND** cookie 有效期 SHALL 为 1 年

#### Scenario: 恢复语言偏好

- **WHEN** 用户再次访问应用
- **THEN** 应用 SHALL 从 cookie 读取语言偏好
- **AND** 以用户之前选择的语言显示界面

#### Scenario: 新用户默认语言

- **WHEN** 新用户首次访问应用（无语言偏好 cookie）
- **THEN** 应用 SHALL 使用英文（en）作为默认语言

### Requirement: 服务端渲染翻译支持

系统 SHALL 支持在 Server Components 中进行翻译，确保 SEO 友好和首屏加载性能。

#### Scenario: Server Component 翻译

- **WHEN** 服务端渲染页面
- **THEN** 翻译文本 SHALL 在服务端完成
- **AND** 返回的 HTML SHALL 包含正确语言的文本

#### Scenario: 客户端水合

- **WHEN** 客户端 JavaScript 加载完成
- **THEN** 客户端状态 SHALL 与服务端渲染的语言一致
- **AND** SHALL NOT 出现水合不匹配警告

### Requirement: 验证消息多语言化

系统 SHALL 支持 Zod 验证错误消息的多语言化。

#### Scenario: 表单验证错误显示

- **WHEN** 用户提交表单但验证失败
- **THEN** 验证错误消息 SHALL 以用户当前语言显示

#### Scenario: 验证消息示例

- **WHEN** 用户语言为中文且 Group 名称为空
- **THEN** 错误消息 SHALL 显示 `名称是必填项` 而不是 `Name is required`

### Requirement: 邮件模板多语言化

系统 SHALL 支持发送多语言邮件。

#### Scenario: 邀请邮件语言

- **WHEN** 发送分享邀请邮件
- **THEN** 邮件内容 SHALL 根据发送者当前语言偏好生成

### Requirement: 翻译文件结构

系统 SHALL 使用结构化的 JSON 文件组织翻译内容。

#### Scenario: 翻译文件位置

- **WHEN** 开发者需要添加或修改翻译
- **THEN** 翻译文件 SHALL 位于 `messages/` 目录
- **AND** 每种语言一个 JSON 文件（`en.json`、`zh.json`）

#### Scenario: 翻译键命名

- **WHEN** 定义翻译键
- **THEN** SHALL 使用点分隔的命名空间格式（如 `nav.dashboard`、`groups.dialog.title`）
- **AND** 相关翻译 SHALL 分组在同一命名空间下
