# group-management Specification

## Purpose

扩展现有的 Group 管理功能，添加分享入口和分享状态指示器。

## MODIFIED Requirements

### Requirement: Group 列表显示分享状态

系统 SHALL 在 group 列表中显示分享状态，并提供快速访问分享功能的入口。

#### Scenario: 显示分享按钮

- **GIVEN** 用户在 `/groups` 页面查看 group 列表
- **THEN** 每个 group 行显示"分享"按钮（Share2 图标）
- **AND** 点击按钮打开分享创建对话框
- **AND** 对话框标题显示："分享 Group: {groupName}"

#### Scenario: 显示分享状态指示器

- **GIVEN** 某个 group 已创建分享
- **WHEN** 用户查看 group 列表
- **THEN** 该 group 行显示分享图标（Share2，蓝色）
- **AND** 鼠标悬停显示分享类型（"公开分享" 或 "私密分享"）
- **AND** 未分享的 group 不显示图标

#### Scenario: 快速访问分享管理

- **GIVEN** 某个 group 已创建分享
- **WHEN** 用户点击分享图标
- **THEN** 打开分享管理对话框或导航到分享详情页面
- **AND** 显示分享链接和管理选项（撤销、查看邀请等）

### Requirement: Group API 包含分享信息

系统 SHALL 在 group 列表 API 中包含分享信息，用于 UI 显示。

#### Scenario: 查询 groups 时包含分享

- **GIVEN** 用户请求 group 列表
- **WHEN** 调用 `GET /api/groups`
- **THEN** API 查询包含分享关联（`include: { share: true }`）
- **AND** 返回的每个 group 包含 `share` 字段（如果有分享）
- **AND** `share` 字段包含：
  - `id` - 分享 ID
  - `type` - 分享类型（PUBLIC / PRIVATE）
  - `createdAt` - 创建时间
- **AND** 如果 group 没有分享，`share` 字段为 null

#### Scenario: 性能优化

- **GIVEN** 用户有大量 groups
- **WHEN** 查询 group 列表
- **THEN** 使用单次 Prisma 查询加载 groups 和分享信息
- **AND** 避免 N+1 查询问题
- **AND** 查询响应时间 < 500ms（目标）
