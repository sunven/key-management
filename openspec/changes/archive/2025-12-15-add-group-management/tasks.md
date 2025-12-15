# Implementation Tasks

## 数据库层

- [x] 在 `prisma/schema.prisma` 中添加 `Group` model（id, userId, name, description, createdAt, updatedAt）
- [x] 在 `prisma/schema.prisma` 中添加 `GroupItem` model（id, groupId, key, value, createdAt, updatedAt）
- [x] 在 `prisma/schema.prisma` 中添加 `ItemTag` model（id, itemId, tag, createdAt）
- [x] 为 `GroupItem.key` 和 `GroupItem.groupId` 添加唯一约束（@@unique([groupId, key])）
- [x] 为 `ItemTag.tag` 添加索引以优化过滤查询
- [x] 运行 `pnpm db:generate` 生成 Prisma Client
- [x] 运行 `pnpm db:push` 推送数据库 schema 变更（注意：需要在有数据库连接的环境中执行）

## API 路由层

### Groups API
- [x] 创建 `app/api/groups/route.ts`
  - [x] 实现 GET 方法：获取当前用户的所有 groups（包含 items 计数）
  - [x] 实现 POST 方法：创建新 group（验证 name 必填，userId 从 session 获取）
- [x] 创建 `app/api/groups/[id]/route.ts`
  - [x] 实现 GET 方法：获取单个 group 详情（验证所有权）
  - [x] 实现 PUT 方法：更新 group（验证所有权和数据）
  - [x] 实现 DELETE 方法：删除 group（验证所有权，级联删除 items 和 tags）

### Group Items API
- [x] 创建 `app/api/groups/[id]/items/route.ts`
  - [x] 实现 GET 方法：获取 group 内所有 items（包含 tags，支持标签过滤）
  - [x] 实现 POST 方法：在 group 内创建 item（验证 key 唯一性，处理 tags）
- [x] 创建 `app/api/groups/[id]/items/[itemId]/route.ts`
  - [x] 实现 GET 方法：获取单个 item 详情（验证所有权）
  - [x] 实现 PUT 方法：更新 item（验证 key 唯一性，更新 tags）
  - [x] 实现 DELETE 方法：删除 item（验证所有权，级联删除 tags）

## Zod Schemas

- [x] 在 `lib/schemas.ts` 中添加 Group 相关验证 schemas
  - [x] 定义 `groupSchema`（name: string 1-100, description: optional string）
  - [x] 定义 `groupUpdateSchema`（同上）
  - [x] 定义 `groupItemSchema`（key: string 1-100, value: string 1-5000, tags: optional array）
  - [x] 定义 `groupItemUpdateSchema`（同上）
  - [x] 定义 `tagSchema`（string 1-50，仅允许字母数字中文连字符下划线）

## UI 组件层

### Group 管理组件
- [x] 创建 `components/groups/group-list.tsx`（客户端组件）
  - [x] 实现 groups 表格（名称、描述、items 数量、创建时间、操作）
  - [x] 实现展开/折叠功能显示 items
  - [x] 集成 GroupDialog 和 GroupItemDialog
  - [x] 实现删除确认对话框
- [x] 创建 `components/groups/group-dialog.tsx`（客户端组件）
  - [x] 使用 React Hook Form + Zod resolver
  - [x] 实现创建和编辑模式
  - [x] 表单字段：name（必填）、description（可选）
- [x] 创建 `components/groups/group-item-list.tsx`（客户端组件）
  - [x] 实现 items 表格（key、value、tags、操作）
  - [x] 实现标签过滤功能
  - [x] 集成 GroupItemDialog
  - [x] 实现删除确认对话框
- [x] 创建 `components/groups/group-item-dialog.tsx`（客户端组件）
  - [x] 使用 React Hook Form + Zod resolver
  - [x] 实现创建和编辑模式
  - [x] 表单字段：key（必填）、value（必填）、tags（可选，多标签输入）
  - [x] 实现标签输入组件（badge 显示，支持添加/删除）
- [x] 创建 `components/groups/tag-filter.tsx`（客户端组件）
  - [x] 实现标签选择器
  - [x] 支持多选标签
  - [x] 显示当前过滤条件
  - [x] 提供清除过滤按钮

### 标签输入组件
- [x] 创建 `components/groups/tag-input.tsx`（可复用组件）
  - [x] 实现标签输入框
  - [x] 支持回车或逗号分隔添加标签
  - [x] 标签以 badge 形式显示
  - [x] 支持点击删除标签
  - [ ] 可选：实现标签自动完成建议（未实现，可在后续迭代中添加）

## 页面层

- [x] 创建 `app/groups/page.tsx`（服务器组件）
  - [x] 渲染 GroupList 组件
  - [x] GroupList 组件内部处理数据获取、页面标题和空状态

## 导航和布局

- [x] 更新 `components/layout/navbar.tsx`
  - [x] 添加 "Groups" 导航链接（指向 `/groups`）
- [x] 更新 `app/page.tsx`（Dashboard）
  - [x] 添加 Groups 统计卡片（显示总数）
  - [x] 添加 "管理 Groups" 快速操作按钮
  - [x] 从数据库查询 groups 总数

## 类型定义

- [x] 使用 Prisma 自动生成的类型（Group、GroupItem、ItemTag）
- [x] 在 `lib/schemas.ts` 中导出 GroupFormData 和 GroupItemFormData 类型

## 测试和验证

- [ ] 手动测试：创建 group
- [ ] 手动测试：编辑 group
- [ ] 手动测试：删除 group（验证级联删除）
- [ ] 手动测试：在 group 内添加 item
- [ ] 手动测试：编辑 item（验证 key 唯一性）
- [ ] 手动测试：删除 item
- [ ] 手动测试：添加多个标签到 item
- [ ] 手动测试：按标签过滤 items
- [ ] 手动测试：用户隔离（使用不同账户验证）
- [ ] 手动测试：响应式布局（移动端和桌面端）
- [ ] 验证所有表单验证规则正常工作
- [ ] 验证所有错误处理正常显示

## 文档

- [ ] 更新 `CLAUDE.md` 添加 Group 管理相关说明
  - [ ] 数据库 schema 说明
  - [ ] API 路由模式
  - [ ] 组件架构
  - [ ] 使用示例

## 依赖关系说明

- 数据库层必须先完成，然后才能开始 API 层
- API 层完成后才能开始 UI 组件层
- UI 组件完成后才能创建页面层
- 导航更新可以与页面层并行进行
- 测试应该在所有功能实现后进行

## 可并行工作

- Zod schemas 可以与 API 路由并行开发
- 不同的 UI 组件可以并行开发（group-list, group-dialog, group-item-dialog, tag-input）
- 导航更新和 Dashboard 更新可以并行进行

## 实现说明

### 数据库注意事项

- 由于数据库服务器在当前环境不可达，`pnpm db:push` 需要在有数据库连接的环境中手动执行
- Prisma Client 已通过 `pnpm db:generate` 生成

### 代码架构

- Zod schemas 添加到现有的 `lib/schemas.ts` 文件中，保持项目一致性
- 使用 Prisma 生成的类型，无需创建单独的类型定义文件
- 遵循现有的 Provider-Token 组件模式
