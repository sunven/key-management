## Context

当前应用的所有 UI 文本都是硬编码在组件中的英文字符串。根据代码分析，大约有 150-200 个独立的用户可见字符串，分布在以下区域：

- 导航栏和布局组件
- 认证页面
- Dashboard 仪表板
- Groups 管理（列表、对话框、表格）
- Shares 管理（列表、对话框、查看页面）
- 主题切换组件
- Toast 消息（成功/错误）
- Zod 验证错误消息
- 邮件模板（已有中文）

应用使用了独特的"赛博朋克/技术"风格，包括大写下划线格式的标签（如 `INIT_NEW_GROUP`）和以 `//` 开头的描述文本。

## Goals / Non-Goals

**Goals:**
- 提供中文（zh）和英文（en）两种语言支持
- 允许用户通过 UI 切换语言
- 持久化用户的语言偏好
- 保持应用的视觉风格一致性（大写下划线格式等）
- 支持服务端渲染（SSR）的翻译

**Non-Goals:**
- 不支持 RTL（从右到左）语言
- 不实现自动语言检测（基于 Accept-Language 头）
- 不支持动态添加新语言（需要代码改动）
- 不修改 URL 结构（不使用 `/en/` 或 `/zh/` 路由前缀）

## Decisions

### 1. i18n 库选择：next-intl

**决定：** 使用 `next-intl` 作为 i18n 解决方案

**原因：**
- 与 Next.js App Router 和 Server Components 深度集成
- 支持 RSC（React Server Components）中的翻译
- 活跃维护，文档完善
- 轻量级，无复杂配置
- 支持 TypeScript 类型安全

**备选方案：**
- `react-i18next` - 更成熟但需要额外配置支持 App Router
- `lingui` - 编译时提取，配置复杂
- 自定义方案 - 维护成本高

### 2. 翻译文件结构：按语言分文件

**决定：** 在 `messages/` 目录下按语言创建 JSON 文件

```
messages/
├── en.json
└── zh.json
```

**原因：**
- 简单直观，易于维护
- 支持 IDE 自动补全和类型检查
- 便于未来扩展更多语言

### 3. 语言切换 UI：集成到用户菜单

**决定：** 在用户下拉菜单中添加语言切换选项，与主题切换类似

**原因：**
- 保持 UI 一致性
- 无需额外的 UI 空间
- 用户易于发现

### 4. 语言偏好持久化：Cookie + localStorage

**决定：** 使用 cookie 存储语言偏好，同时在 localStorage 作为后备

**原因：**
- Cookie 可在服务端读取，支持 SSR
- localStorage 提供客户端持久化后备
- 不依赖用户登录状态

### 5. URL 策略：无路由前缀

**决定：** 不使用 `/en/` 或 `/zh/` 路由前缀

**原因：**
- 现有路由结构简单，无需 SEO 优化（私有应用）
- 减少路由复杂度
- 语言偏好通过 cookie/localStorage 管理

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 遗漏翻译字符串 | 创建详细的字符串清单，逐一迁移；使用 TypeScript 类型检查 |
| 视觉风格不一致 | 在翻译文件中保持大写下划线格式 |
| SSR 水合不匹配 | 使用 `next-intl` 的 SSR 支持，正确配置 provider |
| 性能影响 | `next-intl` 是轻量级库，影响可忽略 |
| 未来需要更多语言 | 当前架构支持扩展，添加新语言只需新增翻译文件 |

## Migration Plan

1. **阶段 1：基础设施**
   - 安装 `next-intl`
   - 创建 i18n 配置
   - 设置 provider 和 middleware

2. **阶段 2：翻译文件**
   - 创建 `messages/en.json` 和 `messages/zh.json`
   - 按模块组织翻译键（nav, auth, groups, shares, common）

3. **阶段 3：组件迁移**
   - 迁移布局组件（navbar, user-menu）
   - 迁移页面组件（dashboard, auth, groups, shares）
   - 迁移对话框和表单组件

4. **阶段 4：动态内容**
   - 迁移 toast 消息
   - 迁移 Zod 验证消息
   - 迁移邮件模板

5. **阶段 5：语言切换 UI**
   - 在用户菜单添加语言切换
   - 实现语言偏好持久化

回滚策略：由于翻译是增量添加的，可以随时回退到硬编码字符串。

## Open Questions

1. **默认语言**：新用户应该默认使用英文还是根据浏览器语言自动选择？
   - 建议：默认英文，用户可手动切换

2. **日期/数字格式**：是否需要本地化日期和数字格式？
   - 建议：当前版本不包含，后续可增强
