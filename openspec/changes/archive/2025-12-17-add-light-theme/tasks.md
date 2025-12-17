# Implementation Tasks

## 1. 设计浅色主题配色方案
- [x] 1.1 定义浅色主题的 CSS 变量（background, foreground, primary, secondary, muted, accent, border, input, ring, destructive, card, popover）
- [x] 1.2 确保浅色主题与深色主题保持一致的视觉层次和对比度
- [x] 1.3 考虑可访问性（WCAG 对比度标准）

## 2. 更新全局样式
- [x] 2.1 修改 `app/globals.css`，将 `:root` 改为浅色主题变量
- [x] 2.2 保持 `.dark` 类的现有深色主题变量不变
- [x] 2.3 更新自定义滚动条样式，支持浅色主题
- [x] 2.4 更新选择文本样式（`::selection`），支持浅色主题

## 3. 集成 next-themes
- [x] 3.1 在 `app/layout.tsx` 中导入 `ThemeProvider` from `next-themes`
- [x] 3.2 用 `<ThemeProvider>` 包裹应用内容，配置 `attribute="class"` 和 `defaultTheme="system"`
- [x] 3.3 移除 `<html>` 标签上的硬编码 `className`，让 next-themes 动态管理
- [x] 3.4 更新 `<body>` 标签的背景样式，使用 CSS 变量而非硬编码颜色

## 4. 创建主题切换组件
- [x] 4.1 创建 `components/theme-toggle.tsx` 客户端组件
- [x] 4.2 使用 `useTheme` hook from `next-themes` 获取和设置主题
- [x] 4.3 提供三个选项：Light、Dark、System（跟随系统）
- [x] 4.4 使用 lucide-react 图标（Sun、Moon、Monitor）
- [x] 4.5 添加适当的样式，与现有 UI 风格一致

## 5. 集成主题切换到导航栏
- [x] 5.1 修改 `components/layout/user-menu.tsx`
- [x] 5.2 在用户菜单中添加主题切换菜单项（在 Sign out 之前）
- [x] 5.3 使用 DropdownMenuSub 创建子菜单，包含 Light、Dark、System 三个选项
- [x] 5.4 显示当前选中的主题（使用 checkmark 图标）

## 6. 测试和验证
- [x] 6.1 测试主题切换功能（Light ↔ Dark ↔ System）
- [x] 6.2 验证主题偏好在页面刷新后保持
- [x] 6.3 测试所有页面（Dashboard、Groups、Shares、Auth）在两种主题下的显示效果
- [x] 6.4 验证所有 UI 组件（buttons、cards、dialogs、forms、tables、badges）在浅色主题下的可读性
- [x] 6.5 测试响应式布局在不同主题下的表现
- [x] 6.6 验证 toast 通知在浅色主题下的显示效果

## 7. 文档更新
- [x] 7.1 更新 CLAUDE.md，添加主题切换功能说明
- [x] 7.2 更新 README.md（如果存在），说明主题切换功能
