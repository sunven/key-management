# 实施任务清单

## 1. 准备和依赖项

- [x] 1.1 安装 Better Auth 依赖：`pnpm add better-auth @better-auth/react @better-auth/next-js`
- [x] 1.2 移除 NextAuth 依赖：`pnpm remove next-auth`
- [x] 1.3 更新环境变量：
  - 添加 `BETTER_AUTH_SECRET`（使用 `openssl rand -base64 32` 生成）
  - 添加 `NEXT_PUBLIC_APP_URL`（开发环境：http://localhost:3100）
  - 保留现有的 `AUTH_GOOGLE_ID` 和 `AUTH_GOOGLE_SECRET`

## 2. 数据库 Schema 更新

- [x] 2.1 更新 [prisma/schema.prisma](prisma/schema.prisma) 中的 User 模型：
  - 添加 `emailVerified Boolean @default(false) @map("email_verified")`
  - 为 `updatedAt` 字段添加 `@updatedAt` 指令
- [x] 2.2 运行 `pnpm db:push` 同步 schema（会自动重建表）
- [x] 2.3 运行 `pnpm db:generate` 重新生成 Prisma Client

## 3. Better Auth 核心设置

- [x] 3.1 创建 Better Auth 服务器配置 [lib/auth.ts](lib/auth.ts)：
  - 从 `better-auth` 导入 `betterAuth`
  - 从 `better-auth/adapters/prisma` 导入 `prismaAdapter`
  - 使用现有 PrismaClient 实例配置 Prisma adapter
  - 使用 social providers 配置 Google OAuth provider
  - 从环境变量设置 base URL
- [x] 3.2 创建 Better Auth React 客户端 [lib/auth-client.ts](lib/auth-client.ts)：
  - 从 `better-auth/react` 导入 `createAuthClient`
  - 使用 base URL 配置
  - 导出 `authClient` 实例
- [x] 3.3 更新环境变量：
  - 添加 `BETTER_AUTH_SECRET`（使用 `openssl rand -base64 32` 生成）
  - 添加 `NEXT_PUBLIC_APP_URL`（生产环境 URL）
  - 保留现有的 `AUTH_GOOGLE_ID` 和 `AUTH_GOOGLE_SECRET`
  - 更新 [.env.example](.env.example) 中的新变量

## 4. 身份验证 API 路由

- [x] 4.1 删除 [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts)
- [x] 4.2 创建 [app/api/auth/[...all]/route.ts](app/api/auth/[...all]/route.ts)：
  - 从 `@/lib/auth` 导入 `auth`
  - 从 `better-auth/next-js` 导入 `toNextJsHandler`
  - 从 `toNextJsHandler(auth)` 导出 `{ GET, POST }`

## 5. 更新 Proxy/Middleware

- [x] 5.1 更新 [proxy.ts](proxy.ts)：
  - 从 `@/lib/auth` 导入 `auth`
  - 从 `next/headers` 导入 `headers`
  - 将 `auth((req) => ...)` 模式替换为 async 函数
  - 使用 `await auth.api.getSession({ headers: await headers() })` 检查会话
  - 将会话检查从 `req.auth` 更新为 `session?.user`
  - 保留现有的公共路由逻辑

## 6. 更新 API 路由（15+ 个文件）

- [x] 6.1 更新 [app/api/groups/route.ts](app/api/groups/route.ts)：
  - 从 `@/lib/auth` 导入 `auth`，从 `next/headers` 导入 `headers`
  - 将 `await auth()` 替换为 `await auth.api.getSession({ headers: await headers() })`
  - 更新会话检查以使用 `session?.user?.id`
- [x] 6.2 更新 [app/api/groups/[id]/route.ts](app/api/groups/[id]/route.ts)（GET、PATCH、DELETE）
- [x] 6.3 更新 [app/api/groups/[id]/items/route.ts](app/api/groups/[id]/items/route.ts)
- [x] 6.4 更新 [app/api/groups/[id]/items/[itemId]/route.ts](app/api/groups/[id]/items/[itemId]/route.ts)
- [x] 6.5 更新 [app/api/shares/route.ts](app/api/shares/route.ts)
- [x] 6.6 更新 [app/api/shares/[shareId]/route.ts](app/api/shares/[shareId]/route.ts)
- [x] 6.7 更新 [app/api/shares/[shareId]/content/route.ts](app/api/shares/[shareId]/content/route.ts)
- [x] 6.8 更新 [app/api/shares/[shareId]/accept/route.ts](app/api/shares/[shareId]/accept/route.ts)
- [x] 6.9 更新 [app/api/shares/[shareId]/reject/route.ts](app/api/shares/[shareId]/reject/route.ts)（如果存在）
- [x] 6.10 更新 [app/api/shares/[shareId]/invitations/[email]/resend/route.ts](app/api/shares/[shareId]/invitations/[email]/resend/route.ts)
- [x] 6.11 更新 [app/api/tags/route.ts](app/api/tags/route.ts)
- [x] 6.12 更新 [app/api/tags/search/route.ts](app/api/tags/search/route.ts)

## 7. 更新 Server Components

- [x] 7.1 更新 [app/page.tsx](app/page.tsx)：
  - 从 `@/lib/auth` 导入 `auth`，从 `next/headers` 导入 `headers`
  - 将 `await auth()` 替换为 `await auth.api.getSession({ headers: await headers() })`
  - 更新会话类型引用
- [x] 7.2 更新 [components/layout/navbar.tsx](components/layout/navbar.tsx)：
  - 更新 auth 导入和会话检索模式
  - 验证用户数据访问（name、image、email）

## 8. 更新 Client Components

- [x] 8.1 更新 [components/layout/user-menu.tsx](components/layout/user-menu.tsx)：
  - 移除 `import { signOut } from 'next-auth/react'`
  - 从 `@/lib/auth-client` 导入 `authClient`
  - 将 `useSession()` 替换为 `authClient.useSession()`
  - 将 `signOut()` 替换为 `authClient.signOut()`
  - 更新会话类型引用
- [x] 8.2 更新 [app/auth/signin/page.tsx](app/auth/signin/page.tsx)：
  - 移除 NextAuth Server Action 模式
  - 从 `@/lib/auth-client` 导入 `authClient`
  - 使用 `'use client'` 转换为 Client Component
  - 使用 `authClient.signIn.social({ provider: 'google', callbackURL: '/' })`
  - 更新按钮点击处理器

## 9. 类型定义清理

- [x] 9.1 删除 [types/next-auth.d.ts](types/next-auth.d.ts)（NextAuth 类型扩展）
- [x] 9.2 如需自定义类型，创建 [types/better-auth.d.ts](types/better-auth.d.ts)
- [x] 9.3 使用 `pnpm build` 验证 TypeScript 编译

## 10. 测试和验证

- [x] 10.1 在开发环境中测试身份验证流程：
  - 使用 Google 登录
  - 验证创建新用户记录
  - 验证重定向到首页
  - 验证用户数据显示在导航栏中
- [x] 10.2 测试登出流程：
  - 在用户菜单中点击登出
  - 验证重定向到登录页面
  - 验证会话已清除
- [x] 10.3 测试 API 路由：
  - 使用身份验证测试 GET [/api/groups](/api/groups)
  - 测试 POST [/api/groups](/api/groups) 创建 group
  - 验证用户隔离（仅看到自己的 groups）
  - 测试其他 API 端点
- [x] 10.4 测试公共共享路由：
  - 创建新 group 和 share
  - 未登录访问 [/share/[shareId]](/share/)
  - 验证公共共享可访问
  - 测试私有共享邀请流程
- [x] 10.5 测试路由保护：
  - 验证登出时 [/groups](/groups) 重定向
  - 验证登出时 [/shares](/shares) 重定向
  - 验证 [/share/*](/share/) 保持可访问

## 11. 文档更新

- [x] 11.1 更新 [CLAUDE.md](CLAUDE.md)：
  - 将 NextAuth.js 引用替换为 Better Auth
  - 更新身份验证流程描述
  - 更新会话管理模式
  - 更新环境变量部分
  - 使用新的会话检索更新 API 路由模式
  - 更新故障排除部分
- [x] 11.2 更新 [.env.example](.env.example)：
  - 移除 `AUTH_SECRET` 和 `NEXTAUTH_URL`
  - 添加 `BETTER_AUTH_SECRET`
  - 添加 `NEXT_PUBLIC_APP_URL`
  - 保留 Google OAuth 变量

## 12. 最终验证

- [x] 12.1 运行生产构建：`pnpm build`
- [x] 12.2 验证没有 TypeScript 错误
- [x] 12.3 验证没有 linting 错误：`pnpm lint`
- [x] 12.4 在本地测试生产构建：`pnpm start`
- [x] 12.5 提交代码并推送
