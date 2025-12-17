# remove-provider-token-feature

## Metadata

- **Change ID**: `remove-provider-token-feature`
- **Status**: Proposed
- **Created**: 2025-12-17
- **Author**: AI Assistant

## Overview

完全移除应用中的 Provider（提供商）和 Token（令牌）管理功能，简化应用架构，专注于 Groups 和 Shares 功能。此变更包括删除所有相关的 UI 组件、API 路由、数据库表和规范文档。

## Why

应用的核心功能已经转向 Groups（配置组）和 Shares（共享）管理，Provider-Token 功能不再需要。移除此功能可以：

1. **简化架构**：减少数据模型复杂度，专注于核心功能
2. **降低维护成本**：减少需要维护的代码和数据库表
3. **提升用户体验**：移除不必要的导航选项，使界面更清晰
4. **减少安全风险**：减少敏感数据（API tokens）的存储和管理

## Scope

### In Scope

1. **数据库变更**：
   - 删除 `providers` 表
   - 删除 `tokens` 表
   - 从 `User` 模型中移除 `providers` 关系
   - 创建数据库迁移脚本

2. **API 路由移除**：
   - 删除 `app/api/providers/` 目录及所有路由
   - 删除 `app/api/tokens/` 目录及所有路由

3. **UI 组件移除**：
   - 删除 `components/providers/` 目录及所有组件
   - 删除 `components/tokens/` 目录及所有组件
   - 删除 `app/providers/` 页面目录
   - 删除 `app/tokens/` 页面目录

4. **导航和仪表板更新**：
   - 从导航栏移除 "PROVIDERS" 链接
   - 更新仪表板统计卡片（移除 providers 和 tokens 相关统计）
   - 更新仪表板快速操作（移除 provider 管理入口）
   - 移除仪表板的 "Recent Providers" 卡片

5. **代码清理**：
   - 从 `lib/schemas.ts` 移除 provider 和 token 相关的 Zod schemas
   - 清理所有 provider/token 相关的类型定义和工具函数

6. **规范文档更新**：
   - 删除 `openspec/specs/provider-token-management/` 规范
   - 更新 `openspec/project.md` 移除 provider-token 相关描述
   - 更新 `CLAUDE.md` 移除 provider-token 相关文档

### Out of Scope

1. **不影响的功能**：
   - Groups 管理功能保持不变
   - Shares 功能保持不变（包括邀请 token，这与 API token 无关）
   - 用户认证和授权机制不变

2. **不修改的文件**：
   - NextAuth 配置（`auth.ts`）仅需移除 User 模型中的 providers 关系
   - Groups 和 Shares 相关组件和 API 保持不变

## Impact Analysis

### Breaking Changes

- **用户数据丢失**：所有现有的 providers 和 tokens 数据将被永久删除
- **URL 失效**：`/providers` 和 `/tokens` 路由将返回 404
- **API 端点移除**：所有 `/api/providers/*` 和 `/api/tokens/*` 端点将不可用

### Migration Path

由于这是完全移除功能，不提供迁移路径。用户需要：
1. 在执行此变更前，如需保留数据，手动导出 provider 和 token 信息
2. 或将需要的凭证迁移到 Groups 功能中

### Risk Assessment

- **风险等级**：高（破坏性变更，永久删除数据）
- **用户影响**：如果有活跃用户正在使用 provider-token 功能，将无法访问其数据
- **回滚复杂度**：高（需要恢复数据库备份）

### Mitigation Strategies

1. **数据备份**：在执行迁移前备份数据库
2. **通知用户**：如果是生产环境，应提前通知用户功能移除
3. **分阶段执行**：
   - 阶段 1：UI 隐藏（标记为废弃）
   - 阶段 2：数据库表删除

## Dependencies

### Affected Specs

- **REMOVED**: `provider-token-management` 规范将被完全删除

### Prerequisites

- 确认没有活跃用户依赖此功能
- 备份生产数据库（如适用）

### Follow-up Work

- 更新 README.md 和其他用户文档
- 如有部署文档，更新环境变量说明（移除 provider/token 相关说明）

## Success Criteria

1. ✅ 数据库中不存在 `providers` 和 `tokens` 表
2. ✅ 访问 `/providers` 和 `/tokens` 返回 404
3. ✅ 导航栏不显示 "PROVIDERS" 链接
4. ✅ 仪表板只显示 groups 和 shares 相关统计
5. ✅ 所有 provider/token 相关代码已从代码库移除
6. ✅ `pnpm build` 和 `pnpm lint` 成功通过
7. ✅ Prisma 生成和迁移成功执行
8. ✅ `openspec/specs/` 目录中不存在 `provider-token-management`

## Open Questions

- ❓ 是否需要保留数据库迁移的回滚脚本？
- ❓ 是否需要在删除前提供数据导出功能？

## Alternatives Considered

### 选项 1：软删除（保留数据库表但隐藏 UI）

**优点**：
- 可以快速回滚
- 保留历史数据

**缺点**：
- 仍需维护数据库表
- 代码复杂度未降低
- 安全风险仍存在

**决定**：不采用，因为目标是完全移除功能

### 选项 2：迁移到 Groups

**优点**：
- 保留用户数据
- 平滑过渡

**缺点**：
- Provider-Token 和 Groups 数据结构不同，迁移复杂
- 增加实施时间

**决定**：不采用，Groups 已经是独立的功能，用户可以手动迁移需要的数据
