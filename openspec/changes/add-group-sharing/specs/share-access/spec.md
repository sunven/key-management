# share-access Specification

## Purpose

提供分享内容的访问和权限验证功能，确保只有授权用户可以查看分享的 group 和 items。支持 PUBLIC（公开访问）和 PRIVATE（需登录且被邀请）两种访问模式。

## ADDED Requirements

### Requirement: 分享访问权限验证

系统 SHALL 在用户访问分享链接时验证权限，根据分享类型和用户身份决定是否允许访问。

#### Scenario: 访问 PUBLIC 分享（未登录）

- **GIVEN** 某个分享类型为 PUBLIC
- **AND** 用户未登录
- **WHEN** 用户访问 `/share/{shareId}`
- **THEN** 系统查询 `Share` 记录（`where: { id: shareId }`）
- **AND** 验证分享类型为 PUBLIC
- **AND** 允许访问，加载分享内容页面
- **AND** 显示只读标识："这是一个公开分享，您无法编辑内容"

#### Scenario: 访问 PUBLIC 分享（已登录）

- **GIVEN** 某个分享类型为 PUBLIC
- **AND** 用户已登录
- **WHEN** 用户访问 `/share/{shareId}`
- **THEN** 系统验证分享类型为 PUBLIC
- **AND** 允许访问，加载分享内容页面
- **AND** 显示用户信息（导航栏显示用户头像和姓名）

#### Scenario: 访问 PRIVATE 分享（未登录）

- **GIVEN** 某个分享类型为 PRIVATE
- **AND** 用户未登录
- **WHEN** 用户访问 `/share/{shareId}`
- **THEN** 系统检测到用户未登录
- **AND** 重定向到登录页面（`/auth/signin?callbackUrl=/share/{shareId}`）
- **AND** 用户登录后自动返回分享页面
- **AND** 继续执行权限验证流程

#### Scenario: 访问 PRIVATE 分享（已登录且被邀请）

- **GIVEN** 某个分享类型为 PRIVATE
- **AND** 用户已登录（邮箱为 user@example.com）
- **AND** 该用户有一个状态为 ACCEPTED 的邀请
- **WHEN** 用户访问 `/share/{shareId}`
- **THEN** 系统查询邀请记录（`where: { shareId, email: user@example.com }`）
- **AND** 验证邀请状态为 ACCEPTED
- **AND** 允许访问，加载分享内容页面
- **AND** 显示只读标识："这是一个私密分享，您无法编辑内容"

#### Scenario: 访问 PRIVATE 分享（已登录但未被邀请）

- **GIVEN** 某个分享类型为 PRIVATE
- **AND** 用户已登录（邮箱为 other@example.com）
- **AND** 该用户没有邀请记录
- **WHEN** 用户访问 `/share/{shareId}`
- **THEN** 系统查询邀请记录，返回 null
- **AND** 显示 403 页面："您没有权限访问此分享"
- **AND** 不泄露分享内容或 group 信息

#### Scenario: 访问 PRIVATE 分享（邀请待处理）

- **GIVEN** 某个分享类型为 PRIVATE
- **AND** 用户已登录且有邀请记录
- **AND** 邀请状态为 PENDING
- **WHEN** 用户访问 `/share/{shareId}`
- **THEN** 系统检测到邀请状态为 PENDING
- **AND** 重定向到邀请接受页面（`/share/{shareId}/accept`）
- **AND** 显示提示："请先接受邀请才能查看分享内容"

#### Scenario: 访问 PRIVATE 分享（邀请已拒绝）

- **GIVEN** 某个分享类型为 PRIVATE
- **AND** 用户已登录且有邀请记录
- **AND** 邀请状态为 REJECTED
- **WHEN** 用户访问 `/share/{shareId}`
- **THEN** 系统检测到邀请状态为 REJECTED
- **AND** 显示 403 页面："您已拒绝此邀请，无法访问分享内容"
- **AND** 提供"重新接受邀请"按钮（更新状态为 ACCEPTED）

#### Scenario: 访问不存在的分享

- **GIVEN** 用户访问某个分享链接
- **WHEN** 系统查询 `Share` 记录，返回 null
- **THEN** 显示 404 页面："分享不存在或已被撤销"
- **AND** 不泄露分享曾经存在的信息

### Requirement: 分享内容展示

系统 SHALL 在分享访问页面展示 group 信息和所有 items，提供只读视图。

#### Scenario: 显示 Group 信息

- **GIVEN** 用户有权访问某个分享
- **WHEN** 用户查看分享内容页面
- **THEN** 页面顶部显示 Group 信息卡片，包含：
  - Group 名称（大标题）
  - Group 描述（如果有）
  - 创建时间
  - Items 数量统计
- **AND** 卡片样式与现有 group 详情页一致

#### Scenario: 显示 Items 列表

- **GIVEN** 用户有权访问某个分享
- **WHEN** 用户查看分享内容页面
- **THEN** 页面显示 items 表格，包含以下列：
  - Key（左对齐）
  - Value（左对齐，支持长文本换行）
  - Tags（显示为 badges）
- **AND** 表格样式与现有 group items 列表一致
- **AND** 如果 group 没有 items，显示空状态："此 Group 暂无配置项"

#### Scenario: 显示 Tags

- **GIVEN** 某个 item 有多个 tags
- **WHEN** 用户查看 items 列表
- **THEN** tags 以 badge 形式显示在 Tags 列
- **AND** 每个 tag 使用不同颜色（可选）
- **AND** 如果 item 没有 tags，显示 "-"

#### Scenario: 只读标识

- **GIVEN** 用户查看分享内容页面
- **THEN** 页面顶部显示 Alert 提示：
  - 图标：Info
  - 文本："这是一个只读分享，您无法编辑内容"
  - 样式：蓝色背景，信息类型
- **AND** 不显示任何编辑、删除按钮
- **AND** 不显示"添加 Item"按钮

#### Scenario: 响应式布局

- **GIVEN** 用户在不同设备上访问分享页面
- **THEN** 页面布局适配移动端和桌面端
- **AND** 表格在移动端可以横向滚动
- **AND** Group 信息卡片在移动端垂直排列
- **AND** 字体大小和间距适配小屏幕

### Requirement: 分享访问 API

系统 SHALL 提供 API 端点用于获取分享内容和验证访问权限。

#### Scenario: 获取分享内容 API

- **GIVEN** 用户请求分享内容
- **WHEN** 调用 `GET /api/shares/{shareId}/content`
- **THEN** API 执行以下逻辑：
  1. 查询 `Share` 记录（`include: { group: { include: { items: { include: { tags: true } } } } }`）
  2. 如果分享不存在，返回 404
  3. 如果分享类型为 PUBLIC，直接返回内容
  4. 如果分享类型为 PRIVATE：
     - 检查用户是否登录
     - 查询邀请记录（`where: { shareId, email: session.user.email }`）
     - 验证邀请状态为 ACCEPTED
     - 如果验证失败，返回 403
  5. 返回分享内容和访问权限信息
- **AND** 响应格式：
  ```json
  {
    "share": {
      "id": "string",
      "type": "PUBLIC" | "PRIVATE",
      "group": {
        "id": number,
        "name": "string",
        "description": "string",
        "createdAt": "string",
        "items": [
          {
            "id": number,
            "key": "string",
            "value": "string",
            "tags": [{ "id": number, "tag": "string" }]
          }
        ]
      }
    },
    "access": {
      "canView": true,
      "viewerEmail": "string" | null
    }
  }
  ```

#### Scenario: 权限验证失败响应

- **GIVEN** 用户无权访问某个分享
- **WHEN** 调用 `GET /api/shares/{shareId}/content`
- **THEN** API 返回 403 错误
- **AND** 响应格式：
  ```json
  {
    "error": "Forbidden",
    "message": "You don't have permission to access this share",
    "reason": "NOT_INVITED" | "INVITATION_PENDING" | "INVITATION_REJECTED" | "LOGIN_REQUIRED"
  }
  ```
- **AND** 前端根据 `reason` 显示不同的错误提示或重定向

### Requirement: 分享页面 SEO 和元数据

系统 SHALL 为 PUBLIC 分享页面提供适当的 SEO 元数据，便于搜索引擎索引（可选）。

#### Scenario: 设置页面标题和描述

- **GIVEN** 用户访问 PUBLIC 分享页面
- **THEN** 页面 `<title>` 设置为："{Group 名称} - 分享"
- **AND** 页面 `<meta name="description">` 设置为：Group 描述（如果有）
- **AND** 页面 `<meta name="robots">` 设置为："noindex, nofollow"（防止搜索引擎索引）

#### Scenario: Open Graph 元数据

- **GIVEN** 用户分享 PUBLIC 分享链接到社交媒体
- **THEN** 页面包含 Open Graph 元数据：
  - `og:title` - Group 名称
  - `og:description` - Group 描述
  - `og:type` - "website"
  - `og:url` - 分享链接
- **AND** 社交媒体预览显示 Group 信息

### Requirement: 分享访问性能优化

系统 SHALL 优化分享页面的加载性能，确保快速响应。

#### Scenario: 数据库查询优化

- **GIVEN** 用户访问分享页面
- **WHEN** 系统加载分享内容
- **THEN** 使用单次 Prisma 查询加载所有数据（`include` 关联）
- **AND** 避免 N+1 查询问题
- **AND** 在 `shares.id` 上创建索引（已有，因为是主键）
- **AND** 在 `share_invitations.shareId` 和 `email` 上创建复合索引

#### Scenario: 服务端渲染

- **GIVEN** 用户访问 PUBLIC 分享页面
- **THEN** 使用 Next.js Server Component 渲染页面
- **AND** 在服务端完成权限验证和数据加载
- **AND** 返回完整的 HTML，无需客户端二次请求
- **AND** 页面加载时间 < 2 秒（目标）

#### Scenario: 缓存策略（PUBLIC 分享）

- **GIVEN** 某个 PUBLIC 分享被频繁访问
- **THEN** 系统可以使用 Next.js ISR（Incremental Static Regeneration）缓存页面
- **AND** 设置 `revalidate: 60`（60 秒后重新生成）
- **AND** 减少数据库查询压力
- **AND** PRIVATE 分享不使用缓存（确保权限实时验证）

### Requirement: 分享访问错误处理

系统 SHALL 提供清晰的错误提示，帮助用户理解访问失败的原因。

#### Scenario: 404 错误页面

- **GIVEN** 用户访问不存在的分享
- **THEN** 显示 404 错误页面，包含：
  - 标题："分享不存在"
  - 说明："此分享可能已被撤销或链接无效"
  - "返回首页"按钮
- **AND** 页面样式与应用整体风格一致

#### Scenario: 403 错误页面

- **GIVEN** 用户无权访问 PRIVATE 分享
- **THEN** 显示 403 错误页面，包含：
  - 标题："无权访问"
  - 说明："您没有权限查看此分享，请联系分享创建者"
  - "返回首页"按钮
- **AND** 如果用户未登录，提供"登录"按钮

#### Scenario: 网络错误处理

- **GIVEN** 用户访问分享页面时网络错误
- **THEN** 显示友好的错误提示："加载失败，请检查网络连接"
- **AND** 提供"重试"按钮
- **AND** 不显示技术错误细节

### Requirement: 分享访问移动端适配

系统 SHALL 确保分享页面在移动设备上正常显示和操作。

#### Scenario: 移动端布局

- **GIVEN** 用户在移动设备上访问分享页面
- **THEN** Group 信息卡片垂直排列
- **AND** Items 表格可以横向滚动
- **AND** 字体大小适配小屏幕（最小 14px）
- **AND** 按钮和链接有足够的点击区域（最小 44x44px）

#### Scenario: 触摸优化

- **GIVEN** 用户在触摸设备上操作
- **THEN** 所有可点击元素有明显的触摸反馈
- **AND** 链接和按钮有足够的间距，避免误触
- **AND** 长文本支持滚动查看

#### Scenario: 移动端性能

- **GIVEN** 用户在移动网络下访问分享页面
- **THEN** 页面加载时间 < 3 秒（3G 网络）
- **AND** 图片和资源经过压缩
- **AND** 使用懒加载优化长列表
