# 设计文档：从 NextAuth.js 迁移到 Better Auth

## 背景

应用当前使用 NextAuth.js v5（beta）进行身份验证，采用 Google OAuth。NextAuth.js v5 仍处于 beta 阶段，文档和社区支持有限。Better Auth 提供了稳定的、生产就绪的替代方案，与 Next.js 16 App Router 集成更清晰，TypeScript 支持更好。

**当前实现的约束：**

- NextAuth.js v5 beta API 可能会发生变化
- 用户同步需要复杂的回调模式
- 会话增强需要多层回调
- 数据库用户 ID 必须手动存储在 JWT token 中
- 会话自定义需要类型扩展

**相关方：**

- 所有已认证的 API 路由（15+ 个文件）
- 用户菜单和导航组件
- 登录页面和身份验证流程
- 数据库 schema（User 模型）
- Middleware/proxy 路由保护

## 目标 / 非目标

**目标：**

- 将 NextAuth.js 替换为 Better Auth 进行身份验证
- 删表重建，当做新项目（无需备份和迁移）
- 保持 Google OAuth 作为身份验证方法
- 保持当前的用户隔离和安全模型
- 简化会话管理模式
- 改进 TypeScript 类型安全

**非目标：**

- 添加新的身份验证提供商（email/password、GitHub 等）
- 更改数据库用户隔离模型
- 修改 API 路由保护模式（仅会话 API 变更）
- 添加新的身份验证功能（2FA、魔术链接等）
- 更改登录流程的 UI/UX

## 决策

### 决策 1：使用 Better Auth Prisma 适配器

**内容：** 使用 Better Auth 官方 Prisma 适配器与 PostgreSQL provider 进行数据库集成。

**原因：**

- 与现有 Prisma 7 设置无缝集成
- 通过 Better Auth CLI 自动管理 schema
- 保持类型安全的数据库查询
- 支持自定义输出路径（`lib/generated/prisma`）

**考虑的替代方案：**

- 直接 PostgreSQL 适配器：会绕过 Prisma，失去类型安全和应用其余部分的一致性
- 自定义适配器：当官方适配器存在时，不必要的复杂性

### 决策 2：删表重建数据库 Schema

**内容：** 修改 User 模型以添加 Better Auth 所需字段，使用 Prisma db:push 直接重建。

**原因：**

- 当做新项目，无需保留任何数据
- 使用 `db:push` 直接同步 schema，无需创建 migration
- Better Auth 需要特定字段：`emailVerified`（boolean）、`createdAt`、`updatedAt`
- 当前 User 模型已有 `createdAt`，只需要 `emailVerified` 并确保 `updatedAt` 存在

**所需的 Schema 变更：**

```prisma
model User {
  id            Int      @id @default(autoincrement())
  email         String   @unique
  emailVerified Boolean  @default(false) @map("email_verified")  // 新增
  name          String?
  image         String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")          // 添加 @updatedAt
  groups        Group[]
  shares        Share[]

  @@map("users")
}
```

**实施策略：**

- 直接修改 schema.prisma
- 运行 `pnpm db:push` 让 Prisma 自动处理表重建
- 首次登录时自动创建用户记录

### 决策 3：服务器端会话模式

**内容：** 使用 Better Auth 的服务器端会话检索，在所有路由中显式传递 headers。

**模式：**

```typescript
// 在 API 路由中
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  // 使用 userId 进行数据库查询
}
```

**原因：**

- 明确且可预测的会话处理
- 在 Server Components 和 API Routes 中一致工作
- 更好的错误处理（没有隐式的 auth() 魔法）
- 关注点清晰分离

**考虑的替代方案：**

- 直接导入 `auth()`：不够明确会话来源，更难测试
- 仅在 middleware 中检查：对于需要用户 ID 的 API 路由不够

### 决策 4：客户端身份验证使用 React 集成

**内容：** 为客户端组件（登出、用户菜单）使用 Better Auth React 客户端。

**模式：**

```typescript
// 创建客户端
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3100'
});

// 在组件中使用
const { data: session } = authClient.useSession();
const { signOut } = authClient;
```

**原因：**

- 通过 nano-store 实现清晰的响应式状态管理
- 类型安全的客户端方法
- 自动会话更新
- 与 Better Auth 模式一致

### 决策 5：保留基于 Proxy 的路由保护

**内容：** 保持现有 [proxy.ts](proxy.ts) 模式，更新为使用 Better Auth 会话检查。

**原因：**

- 当前模式对 Next.js 16 效果良好
- 所需更改最少（仅更新身份验证检查逻辑）
- 与现有架构一致
- 允许公共共享路由保持可访问

**更新的模式：**

```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 允许公共路由
  if (pathname.startsWith('/auth/') ||
      pathname.startsWith('/api/auth/') ||
      pathname.startsWith('/share/') ||
      pathname.startsWith('/api/shares/')) {
    return NextResponse.next();
  }

  // 检查受保护路由的会话
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}
```

### 决策 6：API 路由路径变更

**内容：** 将身份验证处理器从 `/api/auth/[...nextauth]` 移动到 `/api/auth/[...all]`。

**原因：**

- Better Auth 的约定和要求
- 处理所有身份验证端点（signin、signout、callback、session 等）
- 更清晰的 API 结构

**实现：**

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

## 风险 / 权衡

### 风险 1：会话结构变更

**风险：** 现有代码期望 NextAuth 会话结构，Better Auth 会话可能不同。

**影响：** 读取会话数据的 API 路由和组件可能会失效。

**缓解措施：**

- 在迁移前审计所有会话使用点
- 更新会话类型定义
- 迁移后测试所有已认证路由
- Better Auth 会话包含兼容的用户对象，具有 id、email、name、image

### 风险 2：数据库 Schema 同步

**风险：** Schema 变更可能失败。

**影响：** 需要重新运行 `db:push`。

**缓解措施：**

- 先在开发环境测试 schema 变更
- 使用 `pnpm db:push` 直接同步 schema
- 如果失败，检查 schema 语法并重新运行

### 风险 3：破坏性变更部署

**风险：** 在迁移期间应用将无法运行，直到所有更改完成。

**影响：** 用户停机。

**缓解措施：**

- 在部署前完成所有代码更改
- 在低使用时段部署
- 在预发布环境中充分测试
- 准备好回滚计划（还原提交、恢复数据库）

### 风险 4：环境变量

**风险：** 新的 Better Auth 环境变量可能与 NextAuth 不同。

**影响：** 如果环境变量配置不正确，身份验证将失败。

**缓解措施：**

- 记录所有必需的环境变量更改
- 更新 .env.example
- 在部署前在开发环境中验证配置
- Better Auth 使用相同的 OAuth 凭证（AUTH_GOOGLE_ID、AUTH_GOOGLE_SECRET）

## 迁移计划

### 阶段 1：准备

1. 安装 Better Auth 依赖
2. 移除 NextAuth 依赖

### 阶段 2：核心实现

1. 更新数据库 schema（添加 emailVerified 字段）
2. 运行 `pnpm db:push` 重建数据库表
3. 创建 Better Auth 配置（[lib/auth.ts](lib/auth.ts)）
4. 创建 Better Auth 客户端（[lib/auth-client.ts](lib/auth-client.ts)）
5. 更新 API 身份验证处理器路由

### 阶段 3：更新身份验证点

1. 更新 [proxy.ts](proxy.ts) 会话检查
2. 更新所有 API 路由（15+ 个文件）以使用 Better Auth 会话
3. 更新登录页面以使用 Better Auth 客户端
4. 更新用户菜单组件的登出功能
5. 更新导航栏组件

### 阶段 4：测试与清理

1. 测试身份验证流程（登录、登出）
2. 测试所有带身份验证的 API 路由
3. 测试路由保护（公共和私有路由）
4. 移除 NextAuth 类型定义
5. 移除未使用的 NextAuth 依赖
6. 更新文档（[CLAUDE.md](CLAUDE.md)）

### 阶段 5：部署

1. 部署到预发布环境
2. 运行集成测试
3. 在低使用时段部署到生产环境
4. 监控身份验证指标
5. 验证用户会话正常工作

## 回滚计划

如果实施出错：

1. **代码回滚：**
   - 将 Git 提交还原到迁移前状态
   - 运行 `pnpm install` 恢复 NextAuth 依赖

2. **数据库回滚：**
   - 还原 schema.prisma 到原始版本
   - 运行 `pnpm db:push` 重新同步 schema
   - 运行 `pnpm db:generate` 重新生成 Prisma Client

3. **环境回滚：**
   - 恢复原始环境变量
   - 重启开发服务器

4. **验证：**
   - 使用 Google 登录测试
   - 验证可以创建 groups 和 shares

## 待解决问题

1. **会话持续时间：** 是否应该保持与 NextAuth 默认相同的会话超时，还是调整？
   - 建议：保持 Better Auth 默认会话持续时间（7 天）

2. **额外提供商：** 是否应在迁移期间添加 email/password 身份验证？
   - 建议：否，保持迁移专注。如需要可稍后添加。

3. **使用 db:push 还是 migrate：** 应该使用哪种方式同步 schema？
   - 建议：使用 `db:push`，因为当做新项目，无需版本化的 migration 历史。
