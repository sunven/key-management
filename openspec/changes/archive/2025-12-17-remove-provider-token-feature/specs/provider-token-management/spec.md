# provider-token-management Specification Delta

## REMOVED Requirements

此规范整体被移除，因为 Provider-Token 管理功能已从应用中完全删除。

### Requirement: 统一的提供商列表与令牌展示

**状态**: REMOVED

该功能及其所有场景已被移除。应用不再支持 Provider 和 Token 管理。

#### Scenario: 显示提供商列表及令牌数量

**状态**: REMOVED - 页面 `/providers` 已删除

#### Scenario: 展开提供商以显示令牌

**状态**: REMOVED - 统一视图组件已删除

#### Scenario: 折叠已展开的提供商

**状态**: REMOVED - 交互功能已删除

#### Scenario: 同时展开多个提供商

**状态**: REMOVED - 多展开状态管理已删除

### Requirement: 在提供商上下文中管理令牌

**状态**: REMOVED

令牌管理功能已完全移除，包括创建、编辑、删除和可见性切换。

#### Scenario: 从展开视图向提供商添加令牌

**状态**: REMOVED - Token 创建功能已删除

#### Scenario: 从提供商视图编辑令牌

**状态**: REMOVED - Token 编辑功能已删除

#### Scenario: 从提供商视图删除令牌

**状态**: REMOVED - Token 删除功能已删除

#### Scenario: 令牌遮罩和可见性切换

**状态**: REMOVED - Token 显示和安全功能已删除

### Requirement: 令牌路由弃用

**状态**: REMOVED（已实现，现已过时）

`/tokens` 路由不再重定向，直接返回 404，因为整个功能已移除。

#### Scenario: 用户导航到已弃用的令牌路由

**状态**: REMOVED - 现在返回 404 而非重定向

#### Scenario: 直接访问令牌页面

**状态**: REMOVED - 不再有重定向逻辑

### Requirement: 导航更新

**状态**: REMOVED（部分已实现，现已完全移除）

导航已更新，移除了 PROVIDERS 链接。

#### Scenario: 移除导航栏令牌链接

**状态**: REMOVED - PROVIDERS 链接已从导航栏移除

#### Scenario: 更新仪表板快速操作

**状态**: REMOVED - 仪表板不再显示 provider 管理按钮

### Requirement: 提供商-令牌数据完整性

**状态**: REMOVED

数据完整性要求已过时，因为相关数据表已删除。

#### Scenario: 统一视图中的用户隔离

**状态**: REMOVED - 用户隔离在 Groups/Shares 中继续保持，但 Provider-Token 相关隔离已无需求

#### Scenario: 级联删除感知

**状态**: REMOVED - Provider->Token 级联删除已不存在

#### Scenario: 无提供商选择的令牌创建

**状态**: REMOVED - 令牌创建功能已完全删除

## Migration Notes

### 对现有用户的影响

- 所有 provider 和 token 数据将被永久删除
- 访问 `/providers` 或 `/tokens` 将返回 404
- API 端点 `/api/providers/*` 和 `/api/tokens/*` 将返回 404

### 替代方案

用户可以使用 **Groups** 功能来管理配置和密钥：
- Groups 提供灵活的 key-value 存储
- 支持标签系统用于组织
- 支持通过 Shares 功能共享配置

### 数据迁移

不提供自动迁移工具。用户需要：
1. 在执行此变更前手动导出需要的 provider/token 数据
2. 手动将凭证添加到 Groups 中（如需要）

## Related Changes

此变更影响以下规范：

- **provider-token-management** (本规范) - 完全移除
- **group-management** - 不受影响，继续作为主要的配置管理方案

## Rationale

移除 Provider-Token 功能的原因：

1. **功能重叠**：Groups 功能已经提供了灵活的 key-value 存储，可以替代 provider-token
2. **简化架构**：减少数据模型复杂度，降低维护成本
3. **安全考虑**：减少敏感数据（API tokens）的存储和管理风险
4. **用户体验**：简化导航和界面，专注于核心功能

## Validation

验证此规范增量的标准：

- [ ] `openspec/specs/provider-token-management/` 目录已删除
- [ ] `openspec validate remove-provider-token-feature --strict` 通过
- [ ] `openspec list --specs` 不再显示 provider-token-management
- [ ] 所有相关代码、API、UI 已移除
- [ ] 数据库表 `providers` 和 `tokens` 已删除
