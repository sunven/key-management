# theme-switching Specification

## Purpose
TBD - created by archiving change add-light-theme. Update Purpose after archive.
## Requirements
### Requirement: 主题切换功能

系统 SHALL 允许用户在浅色主题（Light）、深色主题（Dark）和系统主题（System）之间切换，并将用户的主题偏好持久化到浏览器本地存储。

#### Scenario: 用户切换到浅色主题

- **WHEN** 用户在导航栏用户菜单中选择 "Light" 主题选项
- **THEN** 应用立即切换到浅色主题
- **AND** 所有页面和组件使用浅色配色方案
- **AND** 用户的主题偏好保存到 localStorage
- **AND** 页面刷新后保持浅色主题

#### Scenario: 用户切换到深色主题

- **WHEN** 用户在导航栏用户菜单中选择 "Dark" 主题选项
- **THEN** 应用立即切换到深色主题
- **AND** 所有页面和组件使用深色配色方案（现有的赛博朋克风格）
- **AND** 用户的主题偏好保存到 localStorage
- **AND** 页面刷新后保持深色主题

#### Scenario: 用户选择跟随系统主题

- **WHEN** 用户在导航栏用户菜单中选择 "System" 主题选项
- **THEN** 应用根据操作系统的主题偏好自动切换主题
- **AND** 如果操作系统使用深色模式，显示深色主题
- **AND** 如果操作系统使用浅色模式，显示浅色主题
- **AND** 当操作系统主题偏好改变时，应用自动跟随切换
- **AND** 用户的主题偏好（System）保存到 localStorage

#### Scenario: 首次访问应用

- **WHEN** 用户首次访问应用（localStorage 中无主题偏好）
- **THEN** 应用默认使用 System 主题模式
- **AND** 根据操作系统的主题偏好显示对应的主题
- **AND** 用户可以随时手动切换到固定主题

#### Scenario: 主题切换无闪烁

- **WHEN** 用户切换主题或刷新页面
- **THEN** 主题切换过程流畅，无明显闪烁
- **AND** 页面加载时立即显示正确的主题（通过 blocking script）
- **AND** 不出现短暂的错误主题显示

### Requirement: 主题切换 UI

系统 SHALL 在导航栏用户菜单中提供主题切换选项，显示当前选中的主题，并使用图标增强可识别性。

#### Scenario: 显示主题切换菜单

- **WHEN** 用户点击导航栏右上角的用户头像
- **THEN** 打开用户下拉菜单
- **AND** 菜单中显示 "Theme" 或 "主题" 菜单项
- **AND** 菜单项带有主题图标（如 Sun/Moon 图标）
- **AND** 主题菜单项位于 "Sign out" 选项之前

#### Scenario: 展开主题子菜单

- **WHEN** 用户悬停或���击 "Theme" 菜单项
- **THEN** 展开主题子菜单
- **AND** 子菜单包含三个选项：Light、Dark、System
- **AND** 每个选项带有对应的图标（Sun、Moon、Monitor）
- **AND** 当前选中的主题选项显示 checkmark 图标

#### Scenario: 选择主题选项

- **WHEN** 用户点击主题子菜单中的某个选项
- **THEN** 应用立即切换到对应的主题
- **AND** 子菜单自动关闭
- **AND** 用户菜单保持打开状态（可选行为）

### Requirement: 浅色主题配色方案

系统 SHALL 提供与深色主题视觉层次一致的浅色主题配色方案，确保所有 UI 组件在浅色主题下清晰可读且符合可访问性标准。

#### Scenario: 浅色主题基础配色

- **WHEN** 应用使用浅色主题
- **THEN** 主背景使用浅灰色或白色（如 `oklch(0.98 0.01 240)`）
- **AND** 主文本使用深灰色或黑色（如 `oklch(0.2 0.02 240)`）
- **AND** 卡片和弹出框使用稍深的浅色背景（如 `oklch(0.99 0.01 240)`）
- **AND** 边框和输入框使用中等灰色（如 `oklch(0.85 0.02 240)`）

#### Scenario: 浅色主题 Primary 颜色

- **WHEN** 应用使用浅色主题
- **THEN** Primary 按钮和链接使用调整后的 cyan 色系（如 `oklch(0.5 0.15 200)`）
- **AND** Primary 颜色在浅色背景下保持足够的对比度和视觉突出度
- **AND** Primary 按钮的文本颜色使用白色或浅色（如 `oklch(0.98 0.01 240)`）

#### Scenario: 浅色主题对比度

- **WHEN** 应用使用浅色主题
- **THEN** 所有文本与背景的对比度符合 WCAG AA 标准（至少 4.5:1）
- **AND** 按钮、链接和交互元素清晰可见
- **AND** 边框和分隔线在浅色背景下清晰可辨

#### Scenario: 浅色主题特殊效果

- **WHEN** 应用使用浅色主题
- **THEN** 阴影效果使用深色阴影（如 `shadow-slate-200`）
- **AND** 悬停效果和焦点状态清晰可见
- **AND** Toast 通知在浅色主题下使用适配的背景和边框颜色

### Requirement: 组件自动适配

系统 SHALL 确保所有现有 UI 组件（buttons、cards、dialogs、forms、tables、badges）在浅色和深色主题下都能正常显示，无需修改组件代码。

#### Scenario: 按钮组件适配

- **WHEN** 应用切换主题
- **THEN** 所有按钮（primary、secondary、ghost、outline、destructive）自动适配新主题
- **AND** 按钮的背景、文本、边框颜色根据主题变化
- **AND** 按钮的悬停和焦点状态在两种主题下都清晰可见

#### Scenario: 表单组件适配

- **WHEN** 应用切换主题
- **THEN** 所有表单组件（input、textarea、select、radio、switch）自动适配新主题
- **AND** 输入框的背景、边框、文本颜色根据主题变化
- **AND** 表单验证错误提示在两种主题下都清晰可读

#### Scenario: 对话框和弹出框适配

- **WHEN** 应用切换主题
- **THEN** 所有对话框（dialog、alert-dialog）和弹出框（popover、dropdown-menu）自动适配新主题
- **AND** 对话框的背景、边框、阴影效果根据主题变化
- **AND** 对话框内的内容在两种主题下都清晰可读

#### Scenario: 表格和列表适配

- **WHEN** 应用切换主题
- **THEN** 所有表格和列表组件自动适配新主题
- **AND** 表格的行背景、边框、文本颜色根据主题变化
- **AND** 悬停行和选中行在两种主题下都清晰可见

#### Scenario: Badge 和标签适配

- **WHEN** 应用切换主题
- **THEN** 所有 badge 和标签组件自动适配新主题
- **AND** Badge 的背景和文本颜色根据主题变化
- **AND** Badge 在两种主题下都保持足够的对比度

### Requirement: 主题偏好持久化

系统 SHALL 将用户的主题偏好保存到浏览器 localStorage 中，确保用户在关闭浏览器后重新访问时保持其选择的主题。

#### Scenario: 保存主题偏好

- **WHEN** 用户切换主题
- **THEN** 系统立即将主题偏好保存到 localStorage
- **AND** localStorage key 为 `theme`（由 next-themes 管理）
- **AND** 保存的值为 `light`、`dark` 或 `system`

#### Scenario: 恢复主题偏好

- **WHEN** 用户重新访问应用
- **THEN** 系统从 localStorage 读取主题偏好
- **AND** 应用立即使用用户上次选择的主题
- **AND** 如果 localStorage 中无主题偏好，使用默认值（system）

#### Scenario: 跨标签页同步

- **WHEN** 用户在一个标签页中切换主题
- **THEN** 其他已打开的标签页自动同步主题变化
- **AND** 所有标签页显示相同的主题

#### Scenario: 清除浏览器数据

- **WHEN** 用户清除浏览器数据（包括 localStorage）
- **THEN** 主题偏好被重置为默认值（system）
- **AND** 应用根据操作系统主题偏好显示对应的主题
- **AND** 用户可以重新选择主题偏好

