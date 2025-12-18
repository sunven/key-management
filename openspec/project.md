# Project Context

## Purpose

这是一个**多用户配置管理应用**，用于安全存储和管理配置组和共享。该应用使团队和个人能够在一个安全的、用户隔离的环境中集中管理他们的配置数据，并通过公共或私有链接进行共享。

**核心目标：**
- 为多个用户提供配置组（Groups）的安全存储
- 在数据库和 API 层面强制执行严格的用户隔离
- 提供直观的 UI 来管理配置组和共享功能
- 支持完整的 CRUD 操作，具有适当的身份验证和授权
- 支持通过公共链接或私有邀请共享配置组

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
- **Prisma 7** - 类型安全的数据库查询，使用 PostgreSQL 适配器（`@prisma/adapter-pg`）
- **Supabase PostgreSQL** - 托管数据库（事务模式）
- **Resend** - 邮件服务（用于发送共享邀请邮件）
- **Zod 4.x** - 运行时类型验证和 schema 定义

**开发工具：**
- **pnpm** - 包管理器（必需，不使用 npm/yarn）
- **Biome** - 快速的代码检查器和格式化工具（替代 ESLint/Prettier）
- **PostCSS** - CSS 处理与 Tailwind v4

**UI 功能：**
- **next-themes** - 主题管理（支持亮色/暗色/系统主题）
- **sonner** - Toast 通知库

## Project Conventions

### Code Style

**Biome 配置（`biome.json`）：**
- **引号风格**：单引号（`'use client'`）
- **缩进**：空格缩进
- **导入组织**：自动排序和优化导入
- **推荐规则**：启用所有推荐的 linting 规则
- **VCS 集成**：与 Git 集成，使用 .gitignore

**TypeScript：**
- 启用严格模式
- 路径别名：`@/*` 映射到项目根目录
- 始终为函数参数和返回值使用显式类型
- 对象形状优先使用 `interface`，联合/交叉类型使用 `type`
- 目标：ES2017，JSX 转换：`react-jsx`（React 19 自动 JSX）

**命名约定：**
- 文件：kebab-case（`group-list.tsx`、`share-dialog.tsx`）
- 组件：PascalCase（`GroupList`、`ShareDialog`）
- 函数/变量：camelCase（`getUserId`、`currentSession`）
- 常量：真正的常量使用 UPPER_SNAKE_CASE
- 数据库表：复数小写（`users`、`groups`、`shares`）

**文件组织：**
- 页面：`app/*/page.tsx`
- API 路由：`app/api/*/route.ts`
- UI 组件：`components/ui/*`（shadcn - 不要直接编辑）
- 功能组件：`components/{feature}/*`（groups、shares）
- 数据库：`prisma/schema.prisma`（单一真实来源）
- 认证：`auth.ts`（NextAuth 配置）

**导入约定：**
- 路径别名：`import { ... } from '@/...'`（项目根目录）
- Prisma Client：`import { PrismaClient } from '../generated/prisma/client'`（相对于 lib/db）
- 认证：`import { auth } from '@/auth'`
- 组件：`import { ComponentName } from '@/components/...'`

**代码质量规则：**
- 除非绝对必要,否则不使用 `any` 类型
- 在异步操作中始终使用 try/catch 处理错误
- 永远不要将敏感数据（令牌、密码）记录到控制台
- Prisma 7 自动返回创建/更新的行（无需 `.returning()`）
- 在 API 路由中始终使用 Zod schema 验证输入
- 使用 `toast.error()` 和 `toast.success()` 提供用户反馈

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
  ↓ (one-to-many)
  ├── groups (userId FK with CASCADE delete)
  │     ↓ (one-to-many)
  │     ├── group_items (groupId FK with CASCADE delete)
  │     │     ↓ (one-to-many)
  │     │     └── item_tags (itemId FK with CASCADE delete)
  │     │
  │     └── share (one-to-one, optional - unique constraint on groupId)
  │
  └── shares (userId FK with CASCADE delete)
        ↓ (one-to-many)
        └── share_invitations (shareId FK with CASCADE delete)
```

**关键约束：**
- `group_items`：unique(groupId, key) - 同一组内的 key 必须唯一
- `shares`：unique(groupId) - 每个组最多只能有一个共享
- `share_invitations`：unique(shareId, email) - 同一共享不能重复邀请同一邮箱
- 所有关系使用 CASCADE 删除，确保数据完整性

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

**配置管理概念：**
- **Group（组）**：配置数据的容器，包含多个键值对项目
- **Group Item（组项）**：组内的键值对数据，可以附加标签
- **Tag（标签）**：用于组织和搜索配置项的元数据
- **Share（共享）**：将组共享给其他用户的机制（公共或私有）
- **User Isolation（用户隔离）**：每个用户只能访问自己的组和共享

**共享模型：**
- 公共共享：任何人都可以通过链接访问（无需登录）
- 私有共享：仅限邀请的用户访问（需要登录和接受邀请）
- 邀请令牌：用于私有共享的临时邀请链接

**安全模型：**
- 通过外键实现数据库级隔离
- 通过会话检查实现 API 级强制执行
- 共享权限验证（公共链接或私有邀请）

**多用户架构：**
- 使用 Google OAuth 进行身份验证（无密码管理）
- 每个用户拥有隔离的数据分区
- 级联删除：user → groups → group_items → item_tags
- 级联删除：user → shares → share_invitations
- 会话包含数据库用户 ID（非 OAuth ID）

## Important Constraints

**安全性：**
- 所有数据库查询必须按 `userId` 过滤（用户隔离）
- 永远不要在日志或错误消息中暴露敏感数据
- GET/UPDATE/DELETE 操作前始终验证所有权
- 不向未授权用户泄露资源存在性（所有失败返回 404）
- 共享访问需要适当的权限验证

**身份验证：**
- Google OAuth 是唯一的身份验证方法
- 会话必须包含数据库中的 `user.id`
- 除 `/auth/*` 外的所有路由都需要身份验证
- 中间件处理重定向到登录页面

**数据库（Prisma 7）：**
- 始终先修改 `prisma/schema.prisma`，然后运行 `pnpm db:generate`
- Prisma Client 生成到自定义目录：`lib/generated/prisma/`
- 开发使用 `pnpm db:push`，生产使用 `pnpm db:migrate`
- 永远不要直接编辑数据库 schema
- 使用 `@prisma/adapter-pg` 进行 PostgreSQL 连接
- 配置文件：`prisma/prisma.config.ts`（Prisma 7 新特性）
- 外键约束强制引用完整性，所有关系使用 CASCADE 删除

**Next.js 16 特性：**
- 动态路由参数必须 await：`const { id } = await params`
- 服务器组件是默认的（交互性需显式 `'use client'`）
- React 19 自动 JSX 转换（无需导入 React）

**性能：**
- 使用关系查询获取连接数据（`include: { items: true }`）
- 最小化客户端 JavaScript（优先使用服务器组件）
- 当前无缓存策略（直接数据库查询）

## External Dependencies

**Supabase (PostgreSQL)：**
- 托管数据库服务
- 通过 Prisma 7 + PostgreSQL 适配器连接（事务模式）
- **环境变量：**
  - `DIRECT_URL` - PostgreSQL 连接字符串（Prisma 使用，**注意不是 DATABASE_URL**）
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥
  - `SUPABASE_SERVICE_ROLE_KEY` - 服务角色密钥（当前未使用）
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

**Resend（邮件服务）：**
- 用于发送私有共享的邀请邮件
- **环境变量：**
  - `RESEND_API_KEY` - Resend API 密钥
  - `RESEND_FROM_EMAIL` - 发件人邮箱地址（如：noreply@yourdomain.com）
- 邮件模板：HTML 格式，包含接受/拒绝按钮
- 实现位置：`lib/email.ts`

**主题系统（next-themes）：**
- 支持三种模式：亮色（Light）、暗色（Dark）、系统（System）
- 默认主题：`system`（跟随操作系统偏好）
- 主题偏好保存在 localStorage
- 暗色主题使用自定义赛博朋克风格（青色/灰色调）
- 主题切换组件：`components/theme-toggle.tsx`
- 用户菜单中可切换主题
