# Project Context

## Purpose

这是一个**多用户密钥管理应用**，用于安全存储和管理 API 提供商的凭证和令牌。该应用使团队和个人能够在一个安全的、用户隔离的环境中集中管理他们的 API 密钥、令牌和提供商配置。

**核心目标：**
- 为多个用户提供 API 提供商凭证的安全存储
- 在数据库和 API 层面强制执行严格的用户隔离
- 提供直观的 UI 来管理提供商和令牌，具备安全功能（令牌遮罩）
- 支持完整的 CRUD 操作，具有适当的身份验证和授权

## Tech Stack

**前端：**
- **Next.js 16** - App Router 与 React Server Components
- **React 19.2.0** - 自动 JSX 转换
- **TypeScript** - 严格模式启用，目标 ES2017
- **shadcn/ui** - New York 风格组件与 Tailwind CSS v4
- **React Hook Form + Zod** - 表单验证和处理
- **lucide-react** - 图标库

**后端：**
- **Next.js API Routes** - RESTful API 端点
- **NextAuth.js v5** - Google OAuth 身份验证
- **Prisma ORM** - 类型安全的数据库查询，支持关系查询
- **Supabase PostgreSQL** - 托管数据库（事务模式）

**开发工具：**
- **pnpm** - 包管理器（必需，不使用 npm/yarn）
- **ESLint** - 代码检查
- **PostCSS** - CSS 处理与 Tailwind v4

## Project Conventions

### Code Style

**TypeScript：**
- 启用严格模式
- 路径别名：`@/*` 映射到项目根目录
- 始终为函数参数和返回值使用显式类型
- 对象形状优先使用 `interface`，联合/交叉类型使用 `type`

**命名约定：**
- 文件：kebab-case（`provider-list.tsx`、`token-dialog.tsx`）
- 组件：PascalCase（`ProviderList`、`TokenDialog`）
- 函数/变量：camelCase（`getUserId`、`currentSession`）
- 常量：真正的常量使用 UPPER_SNAKE_CASE
- 数据库表：复数小写（`users`、`providers`、`tokens`）

**文件组织：**
- 页面：`app/*/page.tsx`
- API 路由：`app/api/*/route.ts`
- UI 组件：`components/ui/*`（shadcn - 不要直接编辑）
- 功能组件：`components/{feature}/*`（providers、tokens）
- 数据库：`prisma/schema.prisma`（单一真实来源）
- 认证：`auth.ts`（NextAuth 配置）

**代码质量规则：**
- 除非绝对必要,否则不使用 `any` 类型
- 在异步操作中始终使用 try/catch 处理错误
- 永远不要将敏感数据（令牌、密码）记录到控制台
- 对所有 INSERT/UPDATE 操作包含返回数据
- 在 API 路由中始终使用 Zod schema 验证输入

### Architecture Patterns

**服务器 vs 客户端组件：**
- 页面（`app/*/page.tsx`）：服务器组件（直接获取数据）
- 交互式 UI：带有 `'use client'` 指令的客户端组件
- 布局/导航栏：尽可能使用服务器组件
- 表单/对话框：客户端组件（使用 React Hook Form）

**数据获取：**
- 服务器组件：直接 Prisma 查询
- 客户端组件：通过 `fetch()` 从 API 路由获取
- 不使用共享数据获取库（无 React Query、SWR）
- 刷新模式：回调（`onSuccess`）到父组件

**数据库 Schema 模式：**
```
users（NextAuth 自动同步）
  ↓ userId FK（CASCADE delete）
providers（用户所有）
  ↓ providerId FK（CASCADE delete）
tokens（提供商所有）
```

**API 路由模式：**
- 始终使用 `await auth()` 检查会话
- 将 `session.user.id` 解析为整数用于数据库查询
- 在所有查询中按 `userId` 过滤（用户隔离）
- 验证 GET/UPDATE/DELETE 操作的所有权
- 对未找到或未授权返回 404（不泄露资源存在性）
- 使用 `where: { id, userId }` 进行所有权检查

**认证流程：**
1. 通过 NextAuth.js 使用 Google OAuth
2. 首次登录时在数据库中自动创建用户
3. 会话中包含数据库用户 ID
4. 中间件保护除 `/auth/*` 和 `/api/auth/*` 外的所有路由

### Testing Strategy

**当前状态：**
- 目前未实现自动化测试基础设施
- 开发使用手动测试工作流

**未来考虑：**
- 工具函数和验证 schema 的单元测试
- 带用户隔离的 API 路由集成测试
- 关键流程的端到端测试（登录、CRUD 操作）
- 用户隔离和令牌处理的安全测试

### Git Workflow

**分支策略：**
- `master` - 生产就绪代码的主分支
- 功能分支：短期存在、描述性命名
- 小改动直接提交到 master（当前实践）

**提交约定：**
- 使用常规提交格式：`type: description`
- 类型：`feat`、`fix`、`refactor`、`docs`、`chore`
- 保持提交专注和原子化
- 编写描述性提交消息

## Domain Context

**密钥管理概念：**
- **Provider（提供商）**：API 服务（如 OpenAI、Anthropic），包含基础 URL 和元数据
- **Token（令牌）**：与提供商关联的 API 密钥/凭证
- **User Isolation（用户隔离）**：每个用户只能访问自己的提供商和令牌

**安全模型：**
- 通过外键实现数据库级隔离
- 通过会话检查实现 API 级强制执行
- UI 中的令牌遮罩（显示 `***...last4`）
- 点击显示完整令牌值
- 令牌以明文存储（未实现应用级加密）

**多用户架构：**
- 使用 Google OAuth 进行身份验证（无密码管理）
- 每个用户拥有隔离的数据分区
- 级联删除：user → providers → tokens
- 会话包含数据库用户 ID（非 OAuth ID）

## Important Constraints

**安全性：**
- 所有数据库查询必须按 `userId` 过滤（用户隔离）
- 永远不要在日志或错误消息中暴露令牌
- GET/UPDATE/DELETE 操作前始终验证所有权
- 不向未授权用户泄露资源存在性（所有失败返回 404）

**身份验证：**
- Google OAuth 是唯一的身份验证方法
- 会话必须包含数据库中的 `user.id`
- 除 `/auth/*` 外的所有路由都需要身份验证
- 中间件处理重定向到登录页面

**数据库：**
- 始终先修改 `prisma/schema.prisma`，然后生成迁移
- 开发使用 `pnpm db:push`，生产使用迁移
- 永远不要直接编辑数据库 schema
- 外键约束强制引用完整性

**Next.js 16 特性：**
- 动态路由参数必须 await：`const { id } = await params`
- 服务器组件是默认的（交互性需显式 `'use client'`）
- React 19 自动 JSX 转换（无需导入 React）

**性能：**
- 使用关系查询获取连接数据（`include: { tokens: true }`）
- 最小化客户端 JavaScript（优先使用服务器组件）
- 当前无缓存策略（直接数据库查询）

## External Dependencies

**Supabase (PostgreSQL)：**
- 托管数据库服务
- 通过 Prisma Client 连接（事务模式）
- 环境变量：`DATABASE_URL`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 通过 Prisma ORM 进行直接 PostgreSQL 查询

**Google OAuth：**
- 通过 NextAuth.js 的身份验证提供商
- 需要 OAuth 客户端 ID 和密钥
- 重定向 URI：`http://localhost:3100/api/auth/callback/google`
- 环境变量：`AUTH_GOOGLE_ID`、`AUTH_GOOGLE_SECRET`

**NextAuth.js v5：**
- 会话管理和 OAuth 集成
- 登录时自动同步用户到数据库
- 环境变量：`AUTH_SECRET`（随机密钥）
- 生产 URL：`NEXTAUTH_URL`

**shadcn/ui：**
- 基于 Radix UI 构建的组件库
- 通过 CLI 安装：`pnpm dlx shadcn@latest add [component]`
- 不要直接编辑 `components/ui/*`（从 CLI 重新生成）
- 使用 Tailwind CSS v4 与 CSS 变量进行主题化
