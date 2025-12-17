# Change: 添加浅色主题切换功能

## Why

目前应用仅支持深色赛博朋克主题（dark cyberpunk theme with cyan/slate colors），虽然视觉效果独特，但在某些使用场景下（如明亮环境、长时间阅读配置数据）用户可能更倾向于使用浅色主题。添加主题切换功能可以提升用户体验，让用户根据个人偏好和使用环境选择合适的主题。

## What Changes

- 在 `app/globals.css` 中添加浅色主题的 CSS 变量定义（`:root` 保持浅色主题，`.dark` 保持现有深色主题）
- 集成 `next-themes` 库（已安装）到应用布局中，提供主题切换功能
- 创建主题切换组件（Theme Toggle），放置在导航栏用户菜单中
- 设计浅色主题配色方案，保持与深色主题一致的视觉层次和品牌识别度
- 确保所有现有组件（buttons、cards、dialogs、forms、tables）在浅色主题下正常显示
- 主题偏好保存在浏览器 localStorage 中，跨会话持久化

## Impact

- **Affected specs**: 新增 `theme-switching` capability
- **Affected code**:
  - `app/globals.css` - 添加浅色主题 CSS 变量
  - `app/layout.tsx` - 集成 ThemeProvider
  - `components/layout/user-menu.tsx` - 添加主题切换菜单项
  - 新增 `components/theme-toggle.tsx` - 主题切换组件
  - 所有现有 UI 组件自动适配（通过 CSS 变量）
- **Breaking changes**: 无
- **User experience**: 用户可以在深色和浅色主题之间自由切换，提升可用性
