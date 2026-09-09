# v0.3 验证记录（2026-09-09）

当前 CACHE：**haoxuan-shell-v13**。测试仅使用隔离浏览器存储，不读取或改写真实 iPhone 的 localStorage。

运行：先在项目目录启动 `python3 -m http.server 8000`，再执行 `TEST_URL=http://localhost:8000 node tests/run.cjs`。需要 Playwright 与已安装的 Chromium/WebKit；可用 NODE_PATH 指定已有运行时。

新增 `tests/health-sleep.cjs`，在 Chromium、WebKit 分别检查：

- 完整/简化/可选 null JSON、BOM/Markdown fence；schema/version/date/source、时间带时区及先后关系、分钟非负/上限、整数醒来次数、非 JSON、溢出到 Infinity 的数值拒绝。解析与失败不写 storage。
- 阶段差异>30分钟和多来源提示，未知阶段显示 —，小时按分钟/60填入。
- Fill Missing Only、已有值与0保护、明确替换仅五项客观字段、主观评分/备注/咖啡因/午睡保护。
- 日期不一致明确预览、确认才写目标日；同日重导须确认；目标并发变更阻止保存，其他日期的并发变更保留。
- Clipboard 不在打开时读取；成功解析、拒绝手动回退；延迟响应不能复活已关闭 sheet 或覆盖新的手动草稿。
- Health 数据移除确认、保留客观字段；没有 Health 的旧状态摘要逐字不变，Health 段独立于 Workout。
- 五种手机尺寸所有页面无横向 overflow（测试关闭 html/body 的横向裁切），睡眠 input 位于 card 内，Health card 和 sheet 不溢出，最后按钮可滚到导航上方。320px可视高度模拟键盘压缩后仍可关闭/解析/预览。

| Viewport | Chromium | WebKit |
|---|---|---|
| 320×568 | 0 overflow / 通过 | 0 overflow / 通过 |
| 375×667 | 0 overflow / 通过 | 0 overflow / 通过 |
| 390×844 | 0 overflow / 通过 | 0 overflow / 通过 |
| 393×852 | 0 overflow / 通过 | 0 overflow / 通过 |
| 430×932 | 0 overflow / 通过 | 0 overflow / 通过 |

现有 v025、v021、v02、strength-regression 套件继续验证基础 UI、Browser/Standalone 布局 fixture、旧 B/C/D、实际记录优先、迁移幂等、备份、计划导入、训练摘要与复制。v025 的原数据代码哈希检查仅规范化四处授权 Daily UI/summary 变更（入口、小时步长、夜醒上限、可选 Health 摘要段）；迁移及训练实现保持原哈希。无 JS pageerror。390px WebKit/Chromium 预览截图已人工检查。

PWA 测试更新至 v13：新模块、两份 Sleep JSON、HTML/Markdown 教程均缓存；离线可解析睡眠示例与计划示例、可读设置教程，预览不创建本地记录。

真实 iPhone 尚需验收：Shortcuts Sleep 读取权限、不同语言菜单、阶段/来源字段可用性、Dictionary/null 序列化、与 Health 原数据核对、实际剪贴板权限和系统键盘/PWA 行为。模拟 WebKit 通过不能代表这些步骤通过。本项目没有制作 .shortcut 文件，没有修改顶部系统 blur 行为。

---

# v0.2.5 验证记录（2026-09-08）

当前CACHE **haoxuan-shell-v12**。新增tests/v025.cjs和v0.2.4导航几何基线，删除无效guard专项tests/v024.cjs，更新run与缓存测试。两引擎×两模式×五宽度20个组合通过：0横向overflow、gap6px、group centerY与两个centerX偏差0px；三个SVG24×24px、stroke1.8px；nav/button高度及label位置与上版一致，comfort仍14px。

动态safe-area和正文避让检查通过，状态/历史/诊断/导入弹窗正常，无JS异常，storage fixture原文不变。测量方法和字体到SVG的比例说明见 [UI-AUDIT-v025.md](UI-AUDIT-v025.md)。不再验证或尝试关闭系统顶部模糊，基础UI冻结。

tests/v02.cjs、strength-regression.cjs 在两引擎全部通过；pwa-v021.cjs 的v12缓存与离线示例检查通过。数据模块、manifest和meta与本轮前逐字节一致。

以下为历史记录；guard相关说明已经失效。

---

# v0.2.4 验证记录（2026-09-08）

当前CACHE **haoxuan-shell-v11**。新增tests/v024.cjs，替换测试入口中的历史v023专项测试；保留旧脚本。Chromium/WebKit × 四种模式识别 × 五种宽度40个组合通过：browser guard隐藏，standalone/media-only/navigator-only guard满足top0、height1、全宽实色无滤镜；0意外横向overflow；gap10px；group centerY与两个centerX偏差均0px；card尺寸不变。

动态safe-area 0/18/34px分别使用14/18/34px bottom padding，验证border-box导航高度、main+32、scroll-padding+24及末尾内容避让。数据fixture原文不变，数据源码哈希兼容检查通过。完整证据和实机边界见 [UI-AUDIT-v024.md](UI-AUDIT-v024.md)。

原 tests/strength-regression.cjs 在 Chromium/WebKit 通过，tests/pwa-v021.cjs 已验证 v11 缓存及离线示例。五种宽度下分别补测0/18/34px安全区，展开动作的完成组/动作按钮及导入按钮均无遮挡。

已在项目中加入scroll-edge workaround，等待真实iPhone验收；自动化只证明guard正确安装，不能证明系统blur关闭。

以下为历史记录。

---

# v0.2.3 验证记录（2026-09-08）

当前CACHE：**haoxuan-shell-v10**。新增 tests/v023.cjs，专项覆盖两引擎×两模式×五宽度：0横向overflow、0应用滤镜层、0额外顶部fixed层；文字组centerY偏差0px、标题/说明centerX偏差0px，card宽高与基线一致。只读viewport诊断随尺寸变化更新，数据fixture原文与统计不变。详见 [UI-AUDIT-v023.md](UI-AUDIT-v023.md)。

测试入口以v023取代只适用旧DOM/top padding的v022专项测试；历史脚本保留。app.js/data-recovery.js仅UI模板插入，其余数据逻辑通过源码归一后hash校验不变。真实iOS状态栏合成与安装模式效果不能由模拟fixture证明。

既有 tests/v021.cjs、v02.cjs、strength-regression.cjs 全部通过；tests/pwa-v021.cjs 已更新并通过 v10 缓存、pwa-ui.js缓存及离线示例检查。JS语法检查通过。

以下为历史版本测试记录。

---

# v0.2.2 UI 验证记录（2026-09-07）

当前 CACHE：**haoxuan-shell-v9**。本轮运行 `tests/v022.cjs` 与更新缓存期望值的 `tests/pwa-v021.cjs`，全部通过；数据实现未改，未重复运行整套迁移/导入测试。完整审计、五种 viewport 数值、安全区模拟和实机边界见 [UI-AUDIT-v022.md](UI-AUDIT-v022.md)。

新增 `tests/v022.cjs`、`tests/fixtures/v021-empty-geometry.json`、`tests/fixtures/v021-data-hashes.json`；测试入口加入v022。两引擎五种宽度：0意外横向overflow、0应用滤镜层、空状态标题/说明中心偏差0px，卡片尺寸和padding与v0.2.1基线一致。诊断fixture统计及完整storage原文不变，数据脚本/manifest/examples哈希一致。无JS异常。v9离线缓存通过。

顶部 blur 的真实 iPhone 视觉效果仍需实机确认。以下为历史版本测试记录。

---

# v0.2.1 验证记录（2026-09-07）

运行：在项目目录启动静态服务器，再执行 `TEST_URL=http://localhost:8000 node tests/run.cjs`。依赖 Playwright 和已安装的 Chromium/WebKit；外部模块可通过 NODE_PATH 指定。测试全部使用隔离浏览器存储，没有读取或改写真实 iPhone 数据。

## 本轮全部通过

- 新增 `tests/v021.cjs`：真实风格旧 B、六动作 C、D 同时出现在历史；替代 ID/history 容器与 canonical 空 C 共存时返回实际 C，摘要实际重量/reps/RIR0/体感/完成状态正确。只读浏览前后原 records/history/sleep 字符串内容不改写。
- 旧 sleep 完整映射；目标仅有 date 时补齐；目标部分空时补齐；新 afternoonFocus 保留；重复迁移/刷新完全不变。数组 records、缺少非必要 root 字段、未识别条目、损坏JSON的保护和原文导出。
- 两个 examples 原始 JSON.parse 均成功且本轮未改文件内容；示例按钮仅填文本。普通JSON、BOM、json/其他语言标签的外层围栏可解析预览；非JSON、尾逗号、缺括号、schema/version/date/数字错误拒绝，storage 前后完全相同。
- 备份导出完整对象、无写入；Chromium 实际剪贴板逐字匹配。空隔离环境预览无写入、确认后恢复3条完成历史与Daily Status及模板；双方实际数据冲突禁覆；本机实际记录胜过导入空计划；导入实际记录胜过本机空计划。
- browser/standalone 环境分支通过 navigator.standalone 模拟识别；这不是实际 iPhone 安装模式验收。
- `tests/v02.cjs` 继续通过，预览总组数断言更新为新的展示文案；独立日期/摘要、A/B/C/D导入、建议/实际分离、空计划确认、真实数据与并发冲突保护、非法输入不写存储、训练摘要无睡眠。
- `tests/strength-regression.cjs` 原样通过：完整 B 日12组、保存/恢复、完成门槛、独立重量、疼痛多选、历史、A模板、每日状态、反馈/剪贴板。
- 新增 `tests/pwa-v021.cjs`：CACHE v8 与新增脚本/两个示例资源真实缓存；Chromium 断网刷新与离线示例预览成功；纯浏览不创建 phantom storage。
- Chromium 和 WebKit 全流程无 pageerror；所有 production JS 语法检查通过；manifest、cardio.js 与两个examples相对v0.2逐字节一致。

## 手机几何测试结果

| Viewport | Chromium | WebKit |
|---|---|---|
| 320 × 568 | 0 unintended overflow | 0 unintended overflow |
| 375 × 667 | 0 unintended overflow | 0 unintended overflow |
| 390 × 844 | 0 unintended overflow | 0 unintended overflow |
| 393 × 852 | 0 unintended overflow | 0 unintended overflow |
| 430 × 932 | 0 unintended overflow | 0 unintended overflow |

扫描关闭 html/body 横向裁切后遍历可见DOM，涵盖训练/每日状态/历史/诊断/导入编辑与预览/备份弹窗。关闭的dialog不参与可见几何扫描；没有豁免可见溢出元素。

五种尺寸均验证：睡眠input在card content左右边界内（1px容差）且高度52px；页面最后控件可滚至fixed nav上方至少8px；导入预览可内部滚动，确认按钮可滚入可视区且至少48px；textarea与预览卡不超出视口。390×320模拟键盘压缩空间，取消按钮仍在可视区。1280×900桌面三页没有溢出，既有训练和状态公共CSS未修改。390px Chromium/WebKit导入预览截图已人工检查。

## 验证边界

没有直接连接真实 iPhone；Safari地址栏、安全区、系统键盘、设备重启及实际PWA安装仍需实机确认。桌面WebKit的移动尺寸不等于真实设备。无法确认自动恢复，需要通过数据诊断或备份恢复。不能从模拟fixture推断真实9/5、9/6、9/7记录已找回。

当前 CACHE **haoxuan-shell-v8**，localStorage key保持 **haoxuan-training-log:v1**，内部version仍为1。下面保留历史测试记录，旧行为以对应版本为准。

---

# v0.2 验证记录（历史）

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
