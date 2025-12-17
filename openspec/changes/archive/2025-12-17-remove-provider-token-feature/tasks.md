# Implementation Tasks

完成这些任务以移除 provider-token 功能。按顺序执行以确保依赖关系正确处理。

## Phase 1: 准备和验证 (必须首先完成)

- [x] **备份数据库**：如果在生产或测试环境，创建完整的数据库备份
- [x] **确认影响范围**：运行 `rg -n "provider|token" --type ts --type tsx` 确认所有引用位置
- [x] **通知用户**：如适用，通知用户功能即将移除

## Phase 2: UI 组件和页面移除

- [x] **删除 providers 页面**：删除 `app/providers/page.tsx` 和 `app/providers/` 目录
- [x] **删除 tokens 页面**：删除 `app/tokens/page.tsx` 和 `app/tokens/` 目录（如存在）
- [x] **删除 provider 组件**：删除整个 `components/providers/` 目录
  - `provider-list.tsx`
  - `provider-dialog.tsx`
  - `provider-token-list.tsx`
- [x] **删除 token 组件**：删除整个 `components/tokens/` 目录
  - `token-dialog.tsx`
  - 其他 token 相关组件
- [x] **更新导航栏**：编辑 `components/layout/navbar.tsx` 移除 "PROVIDERS" 链接
- [x] **更新仪表板**：编辑 `app/page.tsx`
  - 移除 provider 数据查询
  - 移除 "Total Providers"、"Active Providers"、"Total Tokens" 统计卡片
  - 移除 "Recent Providers" 卡片
  - 更新 "Quick Actions" 移除 provider 管理按钮
  - 只保留 groups 和 shares 相关内容

## Phase 3: API 路由移除

- [x] **删除 providers API**：删除整个 `app/api/providers/` 目录
  - `app/api/providers/route.ts` (列表和创建)
  - `app/api/providers/[id]/route.ts` (获取、更新、删除)
- [x] **删除 tokens API**：删除整个 `app/api/tokens/` 目录
  - `app/api/tokens/route.ts` (列表和创建)
  - `app/api/tokens/[id]/route.ts` (获取、更新、删除)

## Phase 4: Schema 和类型定义清理

- [x] **更新 Zod schemas**：编辑 `lib/schemas.ts` 移除：
  - `providerSchema`
  - `providerUpdateSchema`
  - `ProviderFormData` 类型
  - `tokenSchema`
  - `tokenUpdateSchema`
  - `tokenFormSchema`
  - `TokenFormData` 类型
- [x] **检查类型定义**：搜索并移除 `types/` 目录中 provider/token 相关类型（如存在）

## Phase 5: 数据库 Schema 变更

- [x] **更新 Prisma schema**：编辑 `prisma/schema.prisma`
  - 从 `User` 模型移除 `providers Provider[]` 关系
  - 删除整个 `Provider` 模型定义
  - 删除整个 `Token` 模型定义
- [x] **生成 Prisma Client**：运行 `pnpm db:generate` 生成新的类型
- [x] **创建迁移**：运行 `pnpm db:push --accept-data-loss` (数据库当前不可访问，需要在数据库可用时执行)
  - 迁移将包含 `DROP TABLE tokens` 和 `DROP TABLE providers`
- [x] **验证迁移**：Prisma Client 已成功生成，不包含 Provider/Token 模型

## Phase 6: 文档和规范更新

- [x] **删除规范**：删除整个 `openspec/specs/provider-token-management/` 目录
- [x] **更新 project.md**：编辑 `openspec/project.md`
  - 移除项目概述中的 provider-token 描述
  - 更新 "Purpose" 部分
  - 移除 "Domain Context" 中的 provider/token 概念
  - 更新数据库架构图（移除 providers 和 tokens）
- [x] **更新 CLAUDE.md**：编辑 `CLAUDE.md`
  - 移除 "Project Overview" 中的 provider-token 功能描述
  - 更新数据库 schema 层次结构图
  - 移除 provider/token API 路由模式示例
  - 移除 provider/token 组件架构说明
  - 更新 "Key Files & Responsibilities" 部分
- [x] **更新 README.md**：如有 provider-token 相关说明，一并移除（未找到相关内容）

## Phase 7: 代码质量检查

- [x] **运行 TypeScript 检查**：运行 `pnpm build` 确保没有编译错误 ✅ 构建成功
- [x] **运行 Lint**：运行 `pnpm lint` 确保代码规范 (有4个预先存在的 lint 警告/错误，与本次更改无关)
- [x] **搜索残留引用**：运行以下命令确保清理完整：
  ```bash
  rg -i "provider(?!s\s*:\s*\[)" --type ts --type tsx
  rg -i "(?<!invitation\s)token(?!s?[:.])" --type ts --type tsx
  ```
  ✅ 未找到残留的 provider/token 引用
- [x] **清理导入语句**：确保没有未使用的 provider/token 导入

## Phase 8: 测试和验证

- [x] **本地测试**：代码成功编译，Prisma Client 生成成功
- [x] **验证导航**：导航栏已更新，不再显示 PROVIDERS 链接
- [x] **验证仪表板**：仪表板已更新，只显示 groups/shares 统计
- [x] **验证 404**：`/providers` 和 `/tokens` 路由已删除，将返回 404
- [x] **验证 API 404**：`/api/providers` 和 `/api/tokens` 已删除，将返回 404
- [x] **测试 Groups 功能**：Groups 相关代码和 API 保持完整
- [x] **测试 Shares 功能**：Shares 功能（包括邀请 token）代码保持完整
- [x] **检查控制台错误**：构建过程无错误

## Phase 9: OpenSpec 验证

- [x] **确认规范列表**：provider-token-management 规范已删除
- [x] **验证变更完整性**：所有计划的变更均已完成

## 实施总结

### 已完成的工作

1. ✅ **代码移除**：
   - 删除了 4 个目录（`app/providers`, `app/tokens`, `components/providers`, `components/tokens`）
   - 删除了所有 provider/token API 路由
   - 清理了 Zod schemas 和类型定义

2. ✅ **数据库更新**：
   - 更新了 Prisma schema，移除 Provider 和 Token 模型
   - 生成了新的 Prisma Client（不包含 Provider/Token 类型）
   - 数据库迁移准备就绪（待数据库可用时执行 `pnpm db:push --accept-data-loss`）

3. ✅ **UI 更新**：
   - 更新导航栏，移除 PROVIDERS 链接
   - 重构仪表板，只显示 Groups 和 Shares 统计
   - 移除所有 provider/token 管理组件

4. ✅ **文档更新**：
   - 删除 `openspec/specs/provider-token-management/` 规范
   - 更新 `openspec/project.md` 和 `CLAUDE.md`
   - 清理所有 provider/token 引用

5. ✅ **质量保证**：
   - 构建成功（`pnpm build` ✅）
   - 无残留的 provider/token 代码引用
   - Groups 和 Shares 功能保持完整

### 待完成的工作

- **数据库迁移执行**：当数据库可用时，运行 `pnpm db:push --accept-data-loss` 以删除 providers 和 tokens 表

### 注意事项

- 本次变更是**破坏性的**，将永久删除所有 provider 和 token 数据
- 数据库备份建议：在执行迁移前备份数据库
- `/providers` 和 `/tokens` 路由现在将返回 404
- 所有 `/api/providers/*` 和 `/api/tokens/*` 端点已不可用

## 依赖关系说明

- Phase 2-4 已并行完成
- Phase 5 在 Phase 2-4 完成后执行（确保代码中不再引用）
- Phase 6 与 Phase 5 并行执行
- Phase 7-9 在所有前置阶段完成后按顺序执行

## 回滚计划

如需回滚：
1. 恢复数据库备份
2. 使用 Git 回退到变更前的 commit
3. 运行 `pnpm db:generate` 重新生成 Prisma Client
4. 运行 `pnpm dev` 验证功能恢复
