# v0.2.4 — Standalone Scroll Edge Guard

2026-09-08。只做可撤销的 UI / PWA workaround，不认定系统 scroll-edge effect 已是确认根因。

## Top Edge Guard

- index.html 的 body 根层新增真实DOM：`div#pwa-top-edge-guard[aria-hidden=true]`，不用伪元素。
- 默认 display:none。CSS 的 display-mode:standalone 可直接启用；pwa-ui.js 以 media query OR navigator.standalone===true 切换根 class，覆盖 navigator-only 环境。首次执行、pageshow 和模式变化时同步。
- 启用后 fixed、top/left/right=0、height=1px、背景#f3f5f4、opacity1、pointer-events:none、z-index1000；无 filter/backdrop-filter、透明背景、gradient 或 mask。
- 不进入文档流，不增加padding，不移动header。这一条1px的实色元素是明确允许的顶部固定元素，不能把专项扫描中的“0额外层”误读成完全没有guard。
- 普通browser下guard隐藏、无可见矩形。实测standalone rect为top0、left0、right=viewportWidth、height1px。
- 仅尝试影响WebKit的系统scroll-edge选择；自动化不能证明系统blur被关闭。

## Empty State

gap 20px → **10px**。为保留卡片总高度，将group margin-block从4px改为9px：旧20+4+4=28，新10+9+9=28。外部card padding、宽高、字体、边框、圆角均不变，文字组仍垂直居中。

五种宽度、两引擎的content group centerY偏差0px；标题与说明centerX偏差均0px。card几何继续与已保存的v0.2.1/v0.2.2基线一致。

## Bottom Comfort 与正文避让

新增 `--bottom-nav-comfort:14px`。底部padding直接使用 `max(env(safe-area-inset-bottom,0px),var(--bottom-nav-comfort))`，不叠加14px。

| 模拟设备bottom inset | 实际bottom padding |
|---|---|
| 0px | 14px |
| 18px | 18px |
| 34px | 34px |

旧padding是8px+env。env=0时本轮8→14，导航按钮整体实际上移约6px；这是遵循明确14px下限公式的结果，不声称上移了14px。较大safe-area时直接使用设备值，不保留额外8px或叠加comfort。

导航白底仍延伸至内容viewport底部，top/left/right/bottom定位、按钮尺寸/字号不变，不变成悬浮卡。

现有syncNavigationHeight继续把nav实际border-box高度写到CSS变量，main底部是实际高度+32px，html scroll-padding-bottom是实际高度+24px。ResizeObserver改为观察border-box，因此仅padding变化也会触发重新测量；没有改变数据逻辑。首帧CSS高度fallback也使用相同comfort规则。

## Diagnostics

在原iOS/PWA UI Diagnostics增加5项：safe-area-inset-bottom、bottom nav comfort、bottom nav actual bottom padding、scroll-edge guard active/inactive、guard rect top/height。

安全区top/bottom均通过临时不可见零宽测量节点读取CSS env；nav实际padding来自getComputedStyle；guard rect来自真实DOM。仅显示和刷新，不写storage，不用诊断值自动决策训练。

## 保持不变

viewport `width=device-width,initial-scale=1`、status-bar-style default、theme-color #142c28、manifest所有内容不变。没有cover，没有body顶部safe-area padding。records/templates/迁移/备份/导入/schema/摘要/历史选择器未改。

app.js本轮只改变layout ResizeObserver的一行。测试还校验：逆掉这条布局观察选项以及以前两条UI模板插入后，数据代码哈希仍与v0.2.1一致。其余核心数据文件、manifest、examples逐字节不变。测试使用隔离合成fixture，没有操作真实iPhone数据。

## 自动测试

新增tests/v024.cjs；当前入口替代旧v023专项脚本，后者保留历史证据。

Chromium / WebKit × browser / standalone / navigator-only / media-only × 五种宽度，共40个组合通过：

| Viewport | overflow | group centerY偏差 | 两个centerX偏差 | gap |
|---|---|---|---|---|
| 320×568 | 0 | 0px | 0 / 0px | 10px |
| 375×667 | 0 | 0px | 0 / 0px | 10px |
| 390×844 | 0 | 0px | 0 / 0px | 10px |
| 393×852 | 0 | 0px | 0 / 0px | 10px |
| 430×932 | 0 | 0px | 0 / 0px | 10px |

- browser guard inactive；其他三种模式 active，固定1px全宽实色、pointer-events:none，透明度1，无filter/backdrop-filter。
- 关闭外层横向裁切后扫描，0意外横向overflow；允许的fixed元素仅nav、toast、dialog和严格验证过的1pxguard。
- 训练/状态/历史末尾按钮、Diagnostics末尾区块可滚到nav上方至少8px。动态safe-area fixture验证main/nav/scroll-padding同步。
- UI诊断统计与storage原文不变，无JS pageerror；390px WebKit截图人工检查通过。
- 原力量训练回归与v11 PWA/离线示例测试全部通过。两种主模式在五种宽度下分别验证0/18/34px安全区，并检查展开动作的完成组/动作按钮及导入按钮无遮挡。

## 实机说明

已在项目中加入scroll-edge workaround，等待真实iPhone验收；不宣称“顶部blur已解决”。模拟器只能证明guard安装/定位正确，不能证明系统改变scroll-edge渲染。

在原主屏幕PWA联网更新到v11后，数据诊断应显示guard active、top0/height1、comfort14及实际padding。需实机确认：首帧/滚动顶部blur、文字组紧凑感、导航舒适度、Home Indicator与键盘。无需删除/重新添加PWA，不清localStorage。
