# Change: 添加多语言支持（i18n）

## Why

当前应用 UI 全部使用硬编码的英文字符串，无法满足中文用户的使用需求。需要引入国际化（i18n）支持，允许用户在英文和中文之间切换界面语言，提升用户体验。

## What Changes

- 引入 `next-intl` 作为 i18n 解决方案（与 Next.js App Router 深度集成）
- 创建中文（zh）和英文（en）翻译文件
- 将所有硬编码的 UI 字符串迁移到翻译文件
- 添加语言切换 UI 组件（集成到用户菜单）
- 持久化用户语言偏好（localStorage + cookie）
- 更新 Zod 验证消息支持多语言
- 更新邮件模板支持多语言

## Impact

- Affected specs: 新增 `internationalization` 能力规格
- Affected code:
  - `app/` - 所有页面需要包装翻译 hook
  - `components/` - 所有带有文本的组件需要使用翻译函数
  - `lib/schemas.ts` - Zod 验证消息需要多语言化
  - `lib/email.ts` - 邮件模板需要多语言化
  - `middleware.ts` - 需要处理语言检测和路由
  - 新增 `messages/` 目录存放翻译文件
  - 新增 `i18n.ts` 配置文件
