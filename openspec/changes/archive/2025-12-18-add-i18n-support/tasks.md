## 1. 基础设施配置

- [x] 1.1 安装 `next-intl` 依赖
- [x] 1.2 创建 i18n 配置文件 `i18n.ts`
- [x] 1.3 创建 `messages/en.json` 英文翻译文件（包含所有 UI 字符串）
- [x] 1.4 创建 `messages/zh.json` 中文翻译文件
- [x] 1.5 更新 `next.config.ts` 配置 next-intl 插件

## 2. Provider 和布局配置

- [x] 2.1 创建 `components/providers/intl-provider.tsx` 包装组件
- [x] 2.2 更新 `app/layout.tsx` 集成 NextIntlClientProvider
- [x] 2.3 配置服务端翻译获取逻辑

## 3. 布局组件迁移

- [x] 3.1 迁移 `components/layout/navbar.tsx` - 导航链接文本
- [x] 3.2 迁移 `components/layout/user-menu.tsx` - 退出登录文本

## 4. 页面组件迁移

- [x] 4.1 迁移 `app/page.tsx` - Dashboard 仪表板
- [x] 4.2 迁移 `app/auth/signin/page.tsx` - 登录页面
- [x] 4.3 迁移 `app/groups/page.tsx` - Groups 页面
- [x] 4.4 迁移 `app/shares/page.tsx` - Shares 页面
- [x] 4.5 迁移 `app/share/[shareId]/page.tsx` - 共享查看页面
- [x] 4.6 迁移 `app/share/[shareId]/accept/page.tsx` - 接受邀请页面
- [x] 4.7 迁移 `app/share/[shareId]/reject/page.tsx` - 拒绝邀请页面

## 5. Groups 组件迁移

- [x] 5.1 迁移 `components/groups/group-list.tsx` - 列表和过滤器
- [x] 5.2 迁移 `components/groups/group-dialog.tsx` - 新建/编辑对话框
- [x] 5.3 迁移 `components/groups/group-item-list.tsx` - Item 列表
- [x] 5.4 迁移 `components/groups/group-item-dialog.tsx` - Item 对话框
- [x] 5.5 迁移 `components/groups/share-dialog.tsx` - 分享对话框
- [x] 5.6 迁移 `components/groups/global-tag-search.tsx` - 全局标签搜索
- [x] 5.7 迁移 `components/groups/tag-filter.tsx` - 标签过滤器

## 6. Shares 组件迁移

- [x] 6.1 迁移 `components/shares/share-list.tsx` - 分享列表和操作

## 7. 主题组件迁移

- [x] 7.1 迁移 `components/theme-toggle.tsx` - 主题切换文本

## 8. 动态内容多语言化

- [x] 8.1 在 `messages/*.json` 中添加验证消息翻译键
- [x] 8.2 在 `messages/*.json` 中添加邮件模板翻译键
- [x] 8.3 更新所有 toast 消息使用翻译函数

## 9. 语言切换 UI

- [x] 9.1 创建 `components/language-switcher.tsx` 语言切换组件
- [x] 9.2 集成语言切换到 `components/layout/user-menu.tsx`
- [x] 9.3 实现语言偏好 cookie 持久化
- [x] 9.4 创建 `lib/i18n-config.ts` 分离客户端可用的 i18n 常量

## 10. 测试和验证

- [x] 10.1 运行 `pnpm build` 确保无构建错误
