# add-group-management

## 概述

添加一个新的 **Group 管理模块**，用于组织和管理 AI API 提供商的多个配置项（URL 和 token）。每个 group 包含多个 key-value 对象，支持对每个 key-value 对象添加多个自定义标签，并提供基于标签的过滤功能。

## 动机

当前系统的 Provider-Token 模型适合管理单一提供商配置，但在实际使用中，一个 AI API 提供商可能有：
- 多个可用的 API endpoint URLs
- 多个 token 用于负载均衡或备份
- 不同环境的配置（开发、测试、生产）
- 需要按用途或特性分类的配置项

Group 模块提供了一个灵活的 key-value 存储方案，配合标签系统，让用户可以：
- 将相关配置集中管理在一个 group 中
- 使用标签标记配置的用途、环境、优先级等属性
- 快速过滤和查找特定标签的配置项

## 目标

1. **独立的 Group 实体**：创建与 Provider-Token 系统完全独立的 Group 管理功能
2. **灵活的 Key-Value 存储**：支持在 group 内存储任意 key-value 配置，key 在组内唯一
3. **标签系统**：支持为每个 key-value 对象添加多个自定义标签
4. **标签过滤**：提供基于标签的搜索和过滤功能
5. **用户隔离**：保持与现有系统一致的多用户隔离机制
6. **完整 CRUD**：支持对 groups、key-value 对象和标签的完整增删改查操作

## 非目标

- 不与现有的 Provider-Token 系统集成或关联
- 不提供配置版本控制或历史记录
- 不支持 key-value 的加密存储（与 token 一致，使用明文存储）
- 不提供配置导入/导出功能（可在后续迭代中添加）

## 影响范围

### 新增功能
- 数据库 schema：3 个新表（groups, group_items, item_tags）
- API 路由：6 个新端点（groups CRUD, items CRUD）
- UI 组件：Group 管理页面及相关组件
- 导航：新增 "Groups" 导航项

### 现有功能
- 无影响：Group 模块完全独立，不修改现有 Provider-Token 功能

## 用户故事

**作为用户，我想要：**

1. 创建一个名为 "OpenAI Production" 的 group，包含多个 API endpoints 和 tokens
2. 为每个 endpoint 添加标签如 "primary"、"backup"、"us-east"
3. 为每个 token 添加标签如 "high-priority"、"rate-limit-1000"
4. 快速过滤显示所有带 "primary" 标签的配置项
5. 在一个统一界面中查看和管理某个 group 的所有配置

## 技术方案概要

### 数据库设计
```
users
  ↓ userId FK (CASCADE delete)
groups (name, description)
  ↓ groupId FK (CASCADE delete)
group_items (key, value) - key 在 group 内唯一
  ↓ itemId FK (CASCADE delete)
item_tags (tag) - 多对多关系
```

### API 设计
- `GET/POST /api/groups` - 列表和创建
- `GET/PUT/DELETE /api/groups/[id]` - 单个 group 操作
- `GET/POST /api/groups/[id]/items` - group 内的 items 管理
- `PUT/DELETE /api/groups/[id]/items/[itemId]` - 单个 item 操作

### UI 设计
- 新页面：`/groups` - Group 列表页
- 可展开的层级结构：Group → Items（类似 Provider-Token 的展开模式）
- 标签输入：使用 tag input 组件支持多标签
- 标签过滤：提供标签选择器进行过滤

## 风险和缓解

### 风险
1. **数据库性能**：标签过滤可能涉及复杂查询
   - 缓解：为标签字段添加索引，限制单个 group 的 items 数量

2. **UI 复杂度**：标签管理和过滤可能增加 UI 复杂度
   - 缓解：参考成熟的标签 UI 模式，使用 shadcn/ui 的 badge 和 input 组件

3. **用户混淆**：Group 和 Provider 的概念可能让用户困惑
   - 缓解：在 UI 中清晰说明两者的用途差异，提供使用示例

## 成功标准

1. 用户可以创建、编辑、删除 groups
2. 用户可以在 group 内添加、编辑、删除 key-value 对象
3. 用户可以为每个 key-value 对象添加和删除多个标签
4. 用户可以通过标签过滤 group 内的 items
5. 所有操作都遵循用户隔离原则
6. UI 响应流畅，操作直观

## 相关文档

- 参考现有 Provider-Token 实现模式
- 遵循 `openspec/project.md` 中的架构约定
- 数据库 schema 遵循 Prisma 最佳实践
