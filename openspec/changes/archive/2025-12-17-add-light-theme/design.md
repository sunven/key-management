# Design: 浅色主题切换功能

## Context

当前应用使用固定的深色赛博朋克主题（dark cyberpunk theme），配色方案基于 cyan/slate 色系，使用 OKLCH 色彩空间定义 CSS 变量。应用已安装 `next-themes` 库（v0.4.6），但尚未集成。所有 UI 组件基于 shadcn/ui（New York style）和 Tailwind CSS v4，通过 CSS 变量实现主题化。

**技术栈：**
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- shadcn/ui components
- next-themes (已安装但未使用)

**现有主题实现：**
- `app/globals.css` 定义了 `:root` 和 `.dark` 两个相同的深色主题变量集
- `app/layout.tsx` 在 `<body>` 标签上硬编码了深色背景样式
- 所有组件通过 Tailwind 的 CSS 变量（如 `bg-background`、`text-foreground`）引用主题颜色

## Goals / Non-Goals

**Goals:**
- 提供浅色和深色两种主题供用户选择
- 支持跟随系统主题偏好（System mode）
- 主题偏好持久化到 localStorage，跨会话保持
- 浅色主题保持与深色主题一致的视觉层次和品牌识别度
- 所有现有组件无需修改即可适配新主题（通过 CSS 变量）
- 主题切换流畅，无闪烁（next-themes 自动处理）

**Non-Goals:**
- 不添加更多主题（如高对比度主题、自定义主题）
- 不修改现有组件的结构或逻辑
- 不改变应用的整体设计语言和品牌风格
- 不支持每个页面独立的主题设置

## Decisions

### 1. 使用 next-themes 库

**决策：** 使用已安装的 `next-themes` 库管理主题切换。

**理由：**
- 已安装在项目中，无需额外依赖
- 提供开箱即用的主题切换、持久化、SSR 支持
- 自动处理主题闪烁问题（通过 blocking script）
- 支持 System mode（跟随操作系统主题）
- 与 Next.js App Router 完美兼容

**替代方案：**
- 自行实现主题切换逻辑：增加开发成本，需要处理 SSR、闪烁、持久化等问题
- 使用其他主题库（如 `theme-ui`）：引入额外依赖，学习成本高

### 2. 浅色主题配色方案

**决策：** 基于现有深色主题的色彩层次，设计对应的浅色主题配色。

**配色原则：**
- **Background**: 使用浅灰色/白色作为主背景（如 `oklch(0.98 0.01 240)`）
- **Foreground**: 使用深灰色/黑色作为主文本（如 `oklch(0.2 0.02 240)`）
- **Primary**: 保持 cyan 色系，但调整亮度以适配浅色背景（如 `oklch(0.5 0.15 200)`）
- **Secondary/Muted**: 使用浅灰色调（如 `oklch(0.95 0.01 240)`）
- **Border/Input**: 使用中等灰色（如 `oklch(0.85 0.02 240)`）
- **Accent**: 使用稍深的灰色（如 `oklch(0.92 0.01 240)`）
- **Destructive**: 保持红色系，调整亮度（如 `oklch(0.55 0.2 20)`）

**对比度考虑：**
- 确保文本与背景的对比度符合 WCAG AA 标准（至少 4.5:1）
- Primary 按钮在浅色背景下保持足够的视觉突出度
- 边框和分隔线在浅色主题下清晰可见

**替代方案：**
- 使用完全不同的配色方案（如蓝色系）：可能破坏品牌一致性
- 使用 shadcn/ui 默认的浅色主题：与现有深色主题风格不匹配

### 3. 主题切换 UI 位置

**决策：** 将主题切换选项放置在导航栏右上角的用户菜单（User Menu）中。

**理由：**
- 用户菜单是用户个人设置的自然位置
- 不占用导航栏额外空间
- 与现有 UI 结构一致（Sign out 也在用户菜单中）
- 易于发现和访问

**实现方式：**
- 在 `components/layout/user-menu.tsx` 中添加主题切换子菜单
- 使用 `DropdownMenuSub` 组件创建嵌套菜单
- 提供三个选项：Light、Dark、System
- 显示当前选中的主题（使用 checkmark 图标）

**替代方案：**
- 在导航栏添加独立的主题切换按钮：占用空间，移动端布局困难
- 在页面底部添加主题切换：不易发现
- 创建独立的设置页面：增加导航层级，用户体验不佳

### 4. 默认主题策略

**决策：** 默认主题设置为 `system`（跟随系统主题偏好）。

**理由：**
- 尊重用户的操作系统主题偏好
- 提供最佳的开箱即用体验
- 用户可以随时手动切换到固定主题

**行为：**
- 首次访问：跟随系统主题（如果系统是深色，显示深色主题）
- 用户手动切换后：保存用户选择到 localStorage
- 后续访问：使用用户上次选择的主题

**替代方案：**
- 默认深色主题：不尊重用户系统偏好
- 默认浅色主题：与当前应用风格不一致

### 5. CSS 变量组织

**决策：** 保持现有的 CSS 变量结构，`:root` 定义浅色主题，`.dark` 定义深色主题。

**理由：**
- 符合 Tailwind CSS 和 shadcn/ui 的标准实践
- next-themes 默认通过添加 `.dark` 类切换主题
- 所有现有组件无需修改，自动适配

**实现：**
```css
:root {
  /* 浅色主题变量 */
  --background: oklch(0.98 0.01 240);
  --foreground: oklch(0.2 0.02 240);
  /* ... */
}

.dark {
  /* 深色主题变量（保持现有值） */
  --background: oklch(0.02 0.01 240);
  --foreground: oklch(0.9 0.05 200);
  /* ... */
}
```

**替代方案：**
- 使用 data 属性（`[data-theme="light"]`）：需要修改 next-themes 配置，增加复杂度
- 使用多个 CSS 文件：增加维护成本，影响性能

## Risks / Trade-offs

### Risk 1: 浅色主题配色不理想

**风险：** 首次设计的浅色主题配色可能在实际使用中对比度不足或视觉效果不佳。

**缓解措施：**
- 在实现阶段测试所有页面和组件
- 使用浏览器开发工具检查对比度（Chrome DevTools Accessibility）
- 如有问题，快速迭代调整 CSS 变量值
- 参考 shadcn/ui 官方的浅色主题配色

### Risk 2: 现有硬编码样式不适配

**风险：** 部分组件可能使用了硬编码的颜色类（如 `bg-slate-950`、`text-cyan-400`），在浅色主题下显示异常。

**缓解措施：**
- 在实现阶段全面测试所有页面
- 使用 `grep` 搜索硬编码颜色类：`rg "bg-slate-|text-cyan-|border-cyan-"`
- 将硬编码颜色替换为 CSS 变量（如 `bg-background`、`text-foreground`）
- 对于特殊效果（如 glow、shadow），使用 Tailwind 的 dark variant（`dark:shadow-cyan-500`）

### Risk 3: 主题切换性能问题

**风险：** 主题切换可能导致页面重绘，影响性能。

**缓解措施：**
- next-themes 使用 CSS 变量切换，性能开销极小
- 避免在主题切换时触发不必要的 React 重渲染
- 使用 `suppressHydrationWarning` 避免 SSR 不匹配警告

### Trade-off: 维护两套配色方案

**权衡：** 添加浅色主题后，需要维护两套配色方案，增加维护成本。

**接受理由：**
- 配色方案定义在单一文件（`app/globals.css`）中，易于管理
- CSS 变量的使用使得组件无需修改
- 用户体验提升的价值大于维护成本

## Migration Plan

**步骤：**

1. **准备阶段**（无用户影响）
   - 在 `app/globals.css` 中定义浅色主题 CSS 变量
   - 创建 `components/theme-toggle.tsx` 组件
   - 修改 `app/layout.tsx` 集成 ThemeProvider

2. **集成阶段**（用户可见）
   - 修改 `components/layout/user-menu.tsx` 添加主题切换菜单
   - 部署到生产环境

3. **验证阶段**
   - 监控用户反馈
   - 检查是否有样式问题报告
   - 根据反馈调整配色方案

**回滚计划：**
- 如果浅色主题存在严重问题，可以快速回滚：
  1. 移除 `app/layout.tsx` 中的 ThemeProvider
  2. 恢复 `<html>` 标签的硬编码 `className`
  3. 移除用户菜单中的主题切换选项
- 回滚不影响现有深色主题的使用

**数据迁移：**
- 无需数据库迁移
- 用户主题偏好存储在浏览器 localStorage 中
- 如果用户清除浏览器数据，主题偏好会重置为默认值（system）

## Open Questions

1. **是否需要在首次访问时显示主题选择引导？**
   - 当前决策：不需要，默认跟随系统主题即可
   - 可以在后续根据用户反馈添加

2. **是否需要为特定页面（如 Dashboard）添加主题预览功能？**
   - 当前决策：不需要，用户可以直接切换主题查看效果
   - 增加复杂度，收益不明显

3. **是否需要支持自定义主题颜色？**
   - 当前决策：不支持，仅提供预定义的浅色和深色主题
   - 自定义主题需要额外的 UI 和存储逻辑，超出当前范围
