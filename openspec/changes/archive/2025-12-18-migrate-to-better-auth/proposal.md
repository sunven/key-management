# 变更：从 NextAuth.js 迁移到 Better Auth

## 为什么

NextAuth.js v5 目前仍处于 beta 阶段，文档和社区支持有限。Better Auth 提供了更现代、更简洁的身份验证解决方案：
- 稳定的生产就绪 API
- 与 Next.js App Router 更清晰的集成
- 内置 Prisma 适配器支持
- 更简洁的会话管理模式
- 更好的 TypeScript 支持
- 更灵活的数据库 schema 管理

此次迁移将提高可维护性、降低复杂度，并提供更稳定的身份验证基础。

## 变更内容

- 将 NextAuth.js v5 依赖替换为 Better Auth
- 将身份验证配置从 [auth.ts](auth.ts) 更新为 Better Auth 模式
- 将 API 路由处理器从 `/api/auth/[...nextauth]` 迁移到 `/api/auth/[...all]`
- 更新数据库 schema 以匹配 Better Auth 要求
- 替换所有受保护路由和 API 端点中的会话管理模式
- 更新 middleware/proxy 身份验证检查
- 迁移登录页面以使用 Better Auth 客户端
- 更新组件中的客户端身份验证使用（用户菜单、导航栏）

## 影响

- **受影响的规范**: 将创建新的 `authentication` 能力规范
- **受影响的代码**:
  - [auth.ts](auth.ts) - 使用 Better Auth 配置完全重写
  - [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts) - 移动到新路径并更新处理器
  - [app/auth/signin/page.tsx](app/auth/signin/page.tsx) - 更新为使用 Better Auth 客户端
  - [proxy.ts](proxy.ts) - 更新会话检查
  - [components/layout/user-menu.tsx](components/layout/user-menu.tsx) - 更新登出方法
  - [components/layout/navbar.tsx](components/layout/navbar.tsx) - 更新 auth 导入
  - 所有 API 路由（15+ 个文件）- 将 `await auth()` 更新为 Better Auth 会话模式
  - [prisma/schema.prisma](prisma/schema.prisma) - 更新 User 模型以兼容 Better Auth
  - [types/next-auth.d.ts](types/next-auth.d.ts) - 移除 NextAuth 类型扩展
  - [package.json](package.json) - 更新依赖项
- **破坏性变更**: 会话结构和 API 将改变，需要更新所有已认证路由
- **迁移复杂度**: 需要更改数据库 schema，必须保留用户数据
