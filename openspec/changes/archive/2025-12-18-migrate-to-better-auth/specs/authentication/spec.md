# 身份验证规范

## ADDED Requirements

### Requirement: Google OAuth 身份验证

系统 SHALL 使用 Better Auth 和 Google OAuth 提供用户身份验证，允许用户通过 Google 账号登录。

#### Scenario: 用户通过 Google 登录

- **WHEN** 用户访问 `/auth/signin` 页面
- **THEN** 显示 "Sign in with Google" 按钮
- **AND** 点击按钮后重定向到 Google OAuth 授权页面
- **AND** 用户授权后重定向回应用
- **AND** 系统自动创建或更新用户记录
- **AND** 用户被重定向到原始请求的页面或首页

#### Scenario: 首次登录用户创建

- **WHEN** 用户首次通过 Google 登录
- **THEN** 系统在数据库中创建新用户记录
- **AND** 用户记录包含 email、name、image 字段（来自 Google）
- **AND** emailVerified 字段设置为 true
- **AND** 用户 ID 存储在会话中

#### Scenario: 已有用户登录

- **WHEN** 已注册用户通过 Google 登录
- **THEN** 系统更新用户的 name 和 image 字段
- **AND** 不创建重复的用户记录
- **AND** 会话包含用户的数据库 ID

### Requirement: 会话管理

系统 SHALL 使用 Better Auth 管理用户会话，在服务器端和客户端提供会话访问。

#### Scenario: Server Component 中获取会话

- **WHEN** Server Component 需要访问当前用户会话
- **THEN** 使用 `auth.api.getSession({ headers: await headers() })` 获取会话
- **AND** 会话包含 user 对象，包含 id、email、name、image 字段
- **AND** 如果未登录，返回 null

#### Scenario: API Route 中获取会话

- **WHEN** API Route 需要验证用户身份
- **THEN** 使用 `auth.api.getSession({ headers: await headers() })` 获取会话
- **AND** 检查 `session?.user?.id` 是否存在
- **AND** 如果不存在，返回 401 Unauthorized
- **AND** 将 `session.user.id` 解析为整数用于数据库查询

#### Scenario: Client Component 中获取会话

- **WHEN** Client Component 需要显示用户信息或登录状态
- **THEN** 使用 `authClient.useSession()` hook 获取会话
- **AND** hook 返回 `{ data: session, isPending, error }` 对象
- **AND** 会话数据自动响应式更新

### Requirement: 用户登出

系统 SHALL 允许已登录用户退出登录，清除会话状态。

#### Scenario: 用户点击退出登录

- **WHEN** 用户在用户菜单中点击 "Sign out"
- **THEN** 调用 `authClient.signOut()` 方法
- **AND** 清除服务器端会话
- **AND** 清除客户端会话状态
- **AND** 重定向用户到登录页面

#### Scenario: 退出后访问受保护页面

- **WHEN** 用户退出登录后尝试访问受保护页面
- **THEN** 系统检测到无会话
- **AND** 重定向到 `/auth/signin` 页面
- **AND** URL 参数包含 callbackUrl 指向原始页面

### Requirement: 路由保护

系统 SHALL 保护所有路由（除公共路由外），要求用户登录才能访问。

#### Scenario: 访问受保护页面时未登录

- **WHEN** 未登录用户访问受保护页面（如 `/groups`、`/shares`）
- **THEN** proxy 检测到无会话
- **AND** 重定向到 `/auth/signin?callbackUrl={原始路径}`
- **AND** 登录后自动返回原始页面

#### Scenario: 访问公共路由

- **WHEN** 用户访问公共路由（`/auth/*`、`/api/auth/*`、`/share/*`、`/api/shares/*`）
- **THEN** proxy 允许访问，不检查会话
- **AND** 页面正常加载

#### Scenario: API 路由权限验证

- **WHEN** API 路由接收请求
- **THEN** 首先使用 `auth.api.getSession()` 获取会话
- **AND** 如果会话不存在或无 user.id，返回 401
- **AND** 使用 session.user.id 过滤数据库查询，确保用户隔离

### Requirement: 数据库用户模型

系统 SHALL 在数据库中存储用户信息，支持 Better Auth 所需字段。

#### Scenario: User 表结构

- **WHEN** 系统初始化数据库 schema
- **THEN** User 表包含以下字段：
  - `id` (Int, 主键, 自增)
  - `email` (String, 唯一)
  - `emailVerified` (Boolean, 默认 false)
  - `name` (String, 可选)
  - `image` (String, 可选)
  - `createdAt` (DateTime, 默认当前时间)
  - `updatedAt` (DateTime, 自动更新)

#### Scenario: User 关系

- **WHEN** User 与其他表建立关系
- **THEN** User 有 `groups` 关系（一对多）
- **AND** User 有 `shares` 关系（一对多）
- **AND** 删除用户时级联删除所有关联的 groups 和 shares

### Requirement: 身份验证配置

系统 SHALL 配置 Better Auth 使用 Prisma adapter 和 Google OAuth provider。

#### Scenario: Better Auth 配置

- **WHEN** 系统初始化 Better Auth 实例
- **THEN** 使用 Prisma adapter 连接数据库
- **AND** 配置 Google OAuth social provider
- **AND** 使用环境变量 AUTH_GOOGLE_ID 和 AUTH_GOOGLE_SECRET
- **AND** 配置 base URL（开发环境默认 http://localhost:3100）

#### Scenario: API 路由处理

- **WHEN** 系统接收 `/api/auth/*` 请求
- **THEN** 使用 `toNextJsHandler(auth)` 处理所有认证请求
- **AND** 导出 GET 和 POST 方法
- **AND** 处理 signin、signout、callback、session 等端点

### Requirement: 类型安全

系统 SHALL 提供完整的 TypeScript 类型定义，确保会话和用户数据类型安全。

#### Scenario: Session 类型推断

- **WHEN** 开发者访问会话数据
- **THEN** TypeScript 自动推断会话类型
- **AND** session.user 包含正确的字段类型（id: string, email: string, name?: string, image?: string）
- **AND** IDE 提供自动完成和类型检查

#### Scenario: Client 类型定义

- **WHEN** 开发者使用 authClient
- **THEN** 所有方法和 hooks 都有完整类型定义
- **AND** `useSession()` 返回类型推断正确
- **AND** `signOut()` 方法类型安全

### Requirement: 环境变量

系统 SHALL 要求配置必要的环境变量以支持认证功能。

#### Scenario: 必需环境变量

- **WHEN** 系统启动时
- **THEN** 检查以下环境变量存在：
  - `AUTH_GOOGLE_ID` - Google OAuth 客户端 ID
  - `AUTH_GOOGLE_SECRET` - Google OAuth 客户端密钥
  - `BETTER_AUTH_SECRET` - Better Auth 密钥（用于加密）
  - `NEXT_PUBLIC_APP_URL` - 应用 URL（生产环境必需）

#### Scenario: 开发环境默认值

- **WHEN** 运行开发环境
- **THEN** `NEXT_PUBLIC_APP_URL` 默认为 http://localhost:3100
- **AND** 如果缺少必需环境变量，显示清晰错误消息
- **AND** 提示用户配置缺少的变量
