# v0.2.3 — iOS Status Bar / Empty State Audit

2026-09-08。审计现有代码，不代表已读取真实 iPhone 安装时保存的配置。本轮没有访问或修改用户真实 localStorage。

## 实际配置（修改前 → 修改后）

| 项目 | 修改前 | 修改后 |
|---|---|---|
| viewport meta | width=device-width,initial-scale=1,viewport-fit=cover | width=device-width,initial-scale=1 |
| apple-mobile-web-app-capable | yes | yes（不变） |
| mobile-web-app-capable | absent | absent（不变） |
| apple-mobile-web-app-status-bar-style | default | default（不变） |
| theme-color meta | #142c28 | #142c28（不变） |
| manifest.display | standalone | standalone（不变） |
| manifest.background_color | #f3f5f4 | #f3f5f4（不变） |
| manifest.theme_color | #142c28 | #142c28（不变） |

**当前不是 black-translucent。** 没有把 default 冒称为本轮改正的值，也没有证据确认旧安装副本与当前文档的状态栏实际呈现一致。

Apple 的历史 Web App meta 文档说明 default 下 Web Content 位于状态栏下方；black-translucent 才是绘制到整个屏幕。WebKit 文档说明 viewport-fit 默认 auto，由浏览器自动内缩，cover 则关闭自动内缩。这是采用普通视口配置的依据，不是对所有当前 iOS 系统绘制行为的保证。

官方资料：
- https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html
- https://webkit.org/blog/7929/designing-websites-for-iphone-x/

## Standalone 布局审计与变更

- 无 standalone 专用页面定位/滤镜规则；navigator.standalone/display-mode 原用于识别环境，不改变数据或页面布局。
- html/body 未设固定高度、100vh，也没有容器 transform/filter。正文是普通文档滚动；没有自建顶部 fixed/sticky 覆盖层。
- dialog 使用 dvh 上限及 visualViewport 计算；overscroll-behavior:contain 仅在弹窗内部，不影响主文档顶部。
- 移除 viewport-fit=cover，恢复默认 auto；不再追求状态栏后方的 edge-to-edge 内容。
- 同时移除 v0.2.2 的 body safe-area-top padding。顶部安全区交给系统/浏览器内缩，保留原有 header 设计间距。没有加 JS 判断后再次加 padding，browser 与 standalone 使用同一套普通文档布局。
- .bottom-nav 的不透明白底、所有按钮尺寸、fixed 行为、safe-area-inset-bottom、导航高度测量和正文底部间距逐字保留。普通内缩视口下导航锚定内容视口底部；Home Indicator 系统区域由浏览器负责。真实设备具体 inset 值与视觉仍需检查。

## 只读 PWA UI Diagnostics

数据诊断末尾新增独立小区块，显示11项：display-mode、navigator.standalone、viewport完整meta、status-bar-style、theme-color、运行时safe-area-inset-top、innerHeight、documentElement.clientHeight、visualViewport.height/offsetTop、screen.height。

safe-area 通过临时零宽、不可见、绝对定位的测量节点读取 CSS env 计算值，立即移除；不是可见顶部 overlay。没有把诊断值自动用于修改布局或写入存储。visualViewport 不支持时明确显示“不支持”。resize/pageshow/visualViewport变化仅刷新该区块。

注意：display-mode 直接来自 matchMedia，navigator.standalone 单独显示，方便发现平台报告差异；meta值是当前文档值，并非系统安装缓存内部的可读值。

## Empty State 垂直根因

旧 DOM 是 `.panel.empty > h3 + p.muted`。旧 p 的 UA margin 为14px上下：标题+说明的可见联合矩形中心比card中心高7px。390×844 WebKit旧card高105.390625px，实测 group偏差 **-7px**；水平中心是正确的。

现 DOM 为 `.panel.empty > .empty-state-content > h3 + p.muted`。Card保持原有flex居中；group是满宽column flex；标题和说明margin:0，gap:20px。group上下各4px显式外边距：20+4+4替代原先28px的paragraph margins，使卡片总高度和padding保持原值，同时可见文字组真正对称。

未修改卡片宽度、背景、border、圆角、原padding、字体大小或颜色。五种宽度中每套引擎前后card高度一致，group centerY偏差0px，两个centerX偏差0px。

## 测试与边界

新增 tests/v023.cjs。Chromium / WebKit × browser / standalone fixture × 320×568、375×667、390×844、393×852、430×932，20种组合均通过：

- 0 unintended horizontal overflow（临时关闭外层横向裁切扫描）。
- 0应用滤镜层，0未允许的fixed/sticky覆盖层。
- Empty State group centerY偏差0px，标题/说明centerX偏差0px；card宽高/padding与v0.2.1已保存基线相同。
- 正文顶部不重复safe-area；底部导航锚定内容视口，末尾按钮可滚至导航上方至少8px。
- Today/Daily Status/History/Diagnostics/Import modal 正常，无pageerror。
- 诊断数值随视口变化更新；模拟env=59px时能测出59px，但body padding仍为0，说明不会重复添加。
- fixture统计仍为Strength3、Cardio0、B1/C2、Daily Status2；完整存储字符串不变。
- app.js仅新增空状态wrapper；data-recovery.js仅插入只读面板调用。逆掉这两处UI模板插入后，两文件SHA-256与v0.2.1一致。其他数据脚本、manifest、examples逐字节不变。

Standalone fixture是在测试外壳中保留59px系统状态区和34pxHome Indicator区，app iframe使用已经内缩的视口；matchMedia/navigator.standalone按fixture模拟。它证明假定系统内缩后的几何正确，不证明真实iOS执行该内缩、安装配置生效或状态栏合成清晰。

当前测试入口用v023取代历史v022专项测试（v022要求原top padding和旧DOM，保留作历史证据）。既有数据/迁移/导入/备份/力量回归另运行；PWA缓存检查更新为haoxuan-shell-v10，包含pwa-ui.js。

## 真实 iPhone 验收与安装

本轮 status-bar-style 从未改变，无需为了测试一个不存在的 style 变更而要求重新添加PWA。先在原主屏幕App联网加载v10，关闭同站点所有页面后重开，并查看新UI Diagnostics的viewport和meta实际值。

**顶部 blur 的真实 iPhone 视觉效果仍需实机确认。** 需确认首帧顶部、滚动恢复、真实系统safe area与Home Indicator、实际键盘和空状态光学中心。当前没有证据证明模糊的系统层完整根因，不能宣称自动测试已解决所有实机行为。

如果后续需要排查安装时缓存并由用户决定重新添加，必须先导出全部数据备份。不要直接删除PWA、不要清网站数据。本轮不要求重装。
