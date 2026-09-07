# v0.2 验证记录（当前版本）

运行当前测试：`TEST_URL=http://localhost:8000 node tests/run.cjs`。需要已安装的 Playwright、Chromium、WebKit（外部安装可设 NODE_PATH）。测试使用隔离存储；不会操作真实 iPhone 数据。

- `tests/v02.cjs`：旧 sleep 日期映射/数字转换、保留 legacy sleep、不覆盖已有新状态、迁移幂等；9/5 B、9/6 C、9/7 D 和模板内容不变；独立状态日期、完整性、状态摘要和实际剪贴板；训练摘要无睡眠。
- 同一测试覆盖 A/B/C strength 与 D cardio 的解析预览、仅确认才写、空计划明确替换确认、真实数据禁覆、预览后并发修改保护；建议重量与实际输入分离；计划元信息；有氧方案数/名称/目标使用导入值，继续使用原有 cardio.entries。
- 非JSON、错误schema/version/date/type/kind/gym、非有限数值、数字字符串、负数、非整数组数、次数范围反转、缺少名称和无效有氧数值均拒绝，拒绝前后 storage 字符串相同。
- 五种尺寸：320×568、375×667、390×844、393×852、430×932。关闭外层横向裁切后，Workout/Daily Status扫描均为0意外溢出；末尾按钮可滚到导航上方至少8px；导入弹窗可滚动、无横向溢出；390×320模拟键盘缩小可用区域后取消按钮仍可点击。
- `tests/strength-regression.cjs`：原B日完整12组/5动作完成门槛、独立重量修改、保存恢复、历史回看、A模板、自定义动作、摘要与实际剪贴板、Chromium离线刷新通过。WebKit完整在线流程通过。
- Chromium/WebKit均无页面JavaScript异常；JS语法及manifest未改检查通过。390px WebKit每日状态/导入预览截图人工检查通过。
- 当前CACHE为haoxuan-shell-v7，缓存包含daily-status.js与plan-import.js。schema key及内部version仍为v1/1。

真实iPhone的系统键盘、安全区、Safari地址栏与standalone安装未在本轮直接操作。缩小视口是几何模拟，不宣称真实设备验收。存储恢复测试使用隔离浏览器上下文/刷新，不能代替用户设备重启测试。

v0.1按日期注入和旧睡眠布局测试已归档到 `tests/legacy-v01/`，保留作旧版本证据，不属于v0.2测试入口。下文是历史版本记录，功能行为以本节和v0.2 README为准。

---

# 验证记录

2026-09-05，使用本机静态 HTTP 预览与 Playwright 的 Chromium / WebKit 引擎，测试数据为虚构记录，不随交付文件保存。

通过的检查：

- JavaScript 语法检查；manifest JSON、相对路径、192/512 PNG 图标尺寸。
- Chromium / WebKit 在 320、375、390、430、768 px 宽度下没有页面横向溢出。
- 三语动作名显示；触摸按钮至少 48 px 高度；输入字号 16 px；主屏幕安全区 CSS。
- 修改健身房与组记录，刷新后恢复；恢复浏览器 storageState 后数据一致。
- 未完成所有组时不能完成动作；12 组全部完成、5 个动作标记完成后才能结束 B 日。
- RIR 0 正常保存；肩/膝可多选；睡眠时间和 1–5 评分保存并进入摘要。
- 摘要含正确的重量×次数、体感、逐组 RIR、状态、关节及睡眠信息。
- Chromium 实际读取剪贴板并与生成文本逐字比较；WebKit 验证复制结果提示或兼容的手动复制提示。
- 已完成训练显示在历史列表，可重新打开；添加 A 日动作后切回 B 日，原动作和记录保留。
- Chromium Service Worker 首次注册并缓存后，断网刷新可以加载应用及原有记录。
- 完整在线交互流程无页面 JavaScript 错误。

验证边界：

- WebKit 自动化的离线 reload 返回引擎内部错误，因此不将 WebKit 离线导航列为已通过。
- 使用的是桌面引擎与移动视口，不是真实 iPhone。尚未实测 iOS Safari 分享菜单、主屏幕启动、系统键盘、设备重启与飞行模式。
- 关闭浏览器后的验证使用保存并恢复浏览器存储状态模拟；并非在真实 iPhone 上杀进程或重启系统。

建议在部署后的 HTTPS 地址完成一次实机验收：填一组 → 刷新 → 从主屏幕关闭并重开 → 检查数据 → 飞行模式重开 → 复制反馈到备忘录。

## Mobile UX Polish 回归（shell v2）

- 现有 Chromium / WebKit 回归脚本重新通过：完整训练、保存恢复、摘要/复制、历史、A 日模板；Chromium 离线刷新。
- 新增检查尺寸：320×568、375×667、390×844、393×852、430×932。两个引擎的训练、睡眠、历史页面均无横向滚动；输入与按钮可见点击区域高度均不小于 44 px；滚动到页面底部时最后控件位于导航栏上方。
- 390 px WebKit 截图人工检查：睡眠单栏、标签/输入间距、训练体感 2×2、重量/次数整行、五列评分与 RIR。
- 768、1024、1440 px 桌面/平板前后对比：训练与睡眠页面控件/卡片的坐标和尺寸完全一致；统一临时保存提示与焦点后，截图差异少于 0.01% 像素（边缘渲染差异）。
- 使用旧版程序生成 localStorage 样本，再由新版读取：存储字符串不变，摘要逐字一致；已有 18:04 时间保留，未填写时间的 DOM value 仍为空，查看新日期不会写入系统时间。
- 数字键盘提示检查：重量 decimal、次数 numeric、夜醒/午睡 numeric、总睡眠 decimal。
- 空时间框增加仅手机端的 WebKit 显示修正，不更改值或存储；聚焦时保留原生编辑器。
- manifest、index.html、图标保持不变；Service Worker 仅把缓存版本升级至 v2，不清除 localStorage。
- 测试期间无页面 JavaScript 异常。真实 iPhone/PWA 原生时间选择器、系统键盘、安全区与新版安装缓存仍需用户在设备上确认，本轮没有实际控制 iPhone。

## Root-cause layout regression — shell v3

This section supersedes the earlier test that checked only document scrollWidth. Detailed evidence: `LAYOUT-AUDIT.md`.

Run with Playwright installed and a static server serving the project:

```sh
TEST_URL=http://localhost:8000 node tests/layout.cjs
```

Use NODE_PATH if Playwright is installed outside this folder. No dependency or test code is loaded by the PWA. `RESULT_PATH=tests/layout-results.json` optionally saves the JSON report; `SCREENSHOT_DIR` optionally saves screenshots.

The scan inspects all rendered elements, including opened exercise contents. Only non-rendered nodes are ignored; no intentional decorative overflow exclusions are used. html/body clipping is explicitly disabled during tests. Every input/textarea/select is separately checked against its parent card's content bounds (border and padding removed), with 1px tolerance. Labels and controls are checked for spacing; phone inputs must be 52px high.

| Viewport | Unintended overflow | Card content bounds / 52px | Navigation targets |
|---|---:|---|---|
| 320×568 | 0 | PASS | PASS |
| 375×667 | 0 | PASS | PASS |
| 390×844 | 0 | PASS | PASS |
| 393×852 | 0 | PASS | PASS |
| 430×932 | 0 | PASS | PASS |

Each row ran in both Chromium and WebKit, in two geometry configurations: a viewport reduced by 80px to model browser toolbar space, and added 34px bottom navigation padding to model standalone safe area. 20 combinations passed. These are simulations, not actual iOS browser or standalone execution.

Navigation assertions call native scrollIntoView(block:end), then require bottom <= nav.top − 8px for: first set header, first set completion, last exercise's last set completion, last exercise completion, finish-training button, last sleep textarea, last history item. Fixed navigation is not disabled.

Existing full functional tests passed again, including old localStorage data loading, exact summary compatibility, history, clipboard and Chromium offline reload. No page JavaScript errors. Desktop/tablet 768/1024/1440 comparisons check card/control geometry within 1px (WebKit textarea baseline rounding differs by 0.203px) and screenshot tolerance below 0.01% after normalizing ephemeral save status/focus.

Physical-device checks still pending: actual Safari address-bar animation, actual standalone display mode and safe-area values, native iPhone date/time picker rendering, keyboard interaction. Desktop WebKit did not reproduce the reported pre-fix physical-device input overflow; see audit for the distinction between observed defects and defensive intrinsic-size corrections.

## D cardio v6

`tests/d-cardio.cjs` 在 Chromium/WebKit 通过：缺失/空白记录创建、旧D实际数据和重量修改冲突保留；9/5 B、9/6 C、A/B/C模板和睡眠对象不变；三种方案切换保留草稿，切换撤销完成，仅选中方案决定训练完成及摘要；数值按钮、RPE、扶手、体感、疲劳、关节、阻力、持久化、历史与力量摘要兼容。

320×568、375×667、390×844、393×852、430×932：关闭外层横向裁切后逐元素扫描无溢出；末尾按钮 scrollIntoView 后在导航顶部至少8px以上。RPE采用5列两行；体感2列，沿用原样式。CSS未修改。

原B日完整功能回归（显式选择B）以及C日12类注入测试继续运行。无页面JavaScript异常。新脚本 cardio.js 已列入 Service Worker缓存。实际iPhone原生键盘和主屏幕运行仍需设备复核，这些自动测试使用桌面浏览器引擎。
