# v0.2.5 — Final Mobile UI Polish / 基础 UI 冻结

2026-09-08。依据用户真实 iPhone 验收，停止处理 standalone 顶部模糊，将其作为当前 iOS standalone 的系统视觉行为接受；不再增加 workaround。本轮不尝试改变它。

## 无效 Guard 已移除

- 删除 index.html 中的根层DOM。
- 删除 styles.css 中全部guard样式及standalone启用选择器。
- 删除 pwa-ui.js 的模式监听、根class切换、pageshow启用调用和guard rect读取。
- 删除UI Diagnostics中的guard状态/rect，保留其余14项运行模式、meta、safe-area、导航padding和viewport信息。
- 删除 tests/v024.cjs 中guard专项测试；测试入口换为v025，不保留运行时hack。旧版本审计文档仅作历史证据，明确标注失效。

没有修改viewport/status-bar-style/theme-color/manifest、top padding、scroll container、overscroll或固定/粘性定位策略。

## Empty State

- gap 10px → **6px**。
- group margin-block 9px → 11px，保持原28px间距预算：10+9+9 = 6+11+11。
- 卡片宽高、padding、字号/字重、颜色、border/radius不变。
- 两引擎五种宽度实测：group centerY偏差0px；title/description centerX偏差均0px；card几何与保留基线一致。

## 导航图标的实际原尺寸

原图标不是SVG，而是 `◉ / ☾ / ◷` 三个Unicode字符，CSS字号均21px、line-height为normal，依赖系统字体回退。三者字形实际宽度不同：390px Chromium测得约21 / 18.875 / 12.656px；WebKit约19.391 / 18.867 / 12.643px。Range高度含字体度量，不等于图形可见墨迹高度。

为了统一visual box与线宽，保留圆点/月亮/时钟含义，改为三个 **24×24px SVG**，共同viewBox 0 0 24 24、stroke-width 1.8，颜色继承当前active/inactive。使用width/height，不使用transform scale。

24相对旧21px字号是名义尺寸增加 **14.2857%**；不能把它说成每个旧字形的实际像素宽度都增加相同比例，旧字符的宽度本来不同。

为不改变已验收的按钮和导航高度，原字符仅作为不可见且aria-hidden的字体度量占位，SVG位于同一slot内。这是保留旧行盒的布局占位，不会展示或被读屏朗读。可见图标均严格24×24px；标签3px上间距及标签坐标保持。

390px零safe-area基线：Chromium nav高83px、button高60px；WebKit nav高78px、button高55px。修改后逐项相同；其余四种宽度也保持。基础字体差异没有用平台hack强行统一。

## 导航留白和数据逻辑保持

`--bottom-nav-comfort:14px`、max(safe-area-bottom,comfort)、白底、active浅绿背景、inactive灰绿、border-box导航测量、main实际nav高+32、scroll-padding实际nav高+24均不变。

app.js、data-recovery.js、storage-compat.js、daily-status.js、plan-import.js、cardio.js与本轮前逐字节一致；manifest和全部meta也保持。localStorage/schema/记录/模板/迁移/备份/摘要/历史统计没有修改。pwa-ui.js只去掉guard相关内容，其余测量含义不变。

## 测试

新增tests/v025.cjs与tests/fixtures/v024-nav-geometry.json；删除tests/v024.cjs；更新run.cjs与PWA缓存期待值。

Chromium/WebKit × browser/standalone fixture × 五种viewport全部通过：

| Viewport | 意外横向overflow | gap | group centerY | 两个centerX | SVG |
|---|---|---|---|---|---|
| 320×568 | 0 | 6px | 0px | 0 / 0px | 24×24px |
| 375×667 | 0 | 6px | 0px | 0 / 0px | 24×24px |
| 390×844 | 0 | 6px | 0px | 0 / 0px | 24×24px |
| 393×852 | 0 | 6px | 0px | 0 / 0px | 24×24px |
| 430×932 | 0 | 6px | 0px | 0 / 0px | 24×24px |

- 三个SVG线宽均1.8px、无scale，nav/button高度和label位置与v0.2.4基线一致。
- comfort14，动态safe-area 0/18/34px仍使用14/18/34px。正文末尾、展开组/动作按钮、导入按钮和诊断末尾能滚到nav上方至少8px。
- Daily Status、History、Diagnostics、Plan Import弹窗与视口诊断正常，无JS pageerror；storage fixture原文不变。
- 390px WebKit截图人工检查：图标适度增大，文字组更紧凑，导航留白保留。
- 本轮另外运行原v02功能回归、完整力量回归及v12离线缓存测试，全部通过。

## 版本与冻结

README v0.2.5；CACHE haoxuan-shell-v12。基础UI以本版冻结，后续仅根据明确新需求修改；不继续排查或尝试修复顶部系统模糊。无需清localStorage、删除或重装PWA。模拟测试不是实机系统视觉验证，本轮没有声称顶部模糊消失。
