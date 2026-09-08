# Haoxuan Training Log v0.2.5

原生 HTML / CSS / JavaScript，移动端优先的本地 PWA。无服务器后端、数据库、账号、AI 推断或外部请求。Workout 与 Daily Status 独立；训练计划通过本地 JSON 解析、预览、确认导入。

## 推荐工作流

晚上：打开“每日状态” → 选择描述的当天日期 → 填写睡眠、精力与恢复 → 生成今日状态反馈 → 复制给 ChatGPT。

ChatGPT 根据今日状态、最近训练反馈及 A→B→C→D 循环生成明日计划 JSON。App 自身不决定训练类型、增重、减量、热量或训练处方。

第二天：今日训练 → 导入今日计划 → 粘贴 JSON → 解析计划 → 查看预览 → 确认导入 → 训练 → 生成独立训练反馈 → 复制给 ChatGPT。

每个日期＋训练类型通过兼容选择器显示一条 Workout（旧原始重复记录保留，实际数据优先）；同一天不同类型可独立保存。历史列表仅显示 Workout，每日状态用自己的日期选择器回看。

## 本地启动与 GitHub Pages

```sh
python3 -m http.server 8000
```

在项目目录执行，然后打开 http://localhost:8000 。不要直接双击 index.html，file:// 不支持正常的 Service Worker。手机局域网 HTTP 仅适合预览，完整 PWA/剪贴板请用 HTTPS。

把本目录的应用文件上传到 GitHub 仓库根目录（含 .nojekyll、icons），Settings → Pages → Deploy from a branch → main / (root)。应用使用相对路径，适用于 `https://用户名.github.io/仓库名/`。官方步骤：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

Safari 打开 HTTPS 网站 → 分享 → 添加到主屏幕。首次联网缓存后可离线记录、导入和导出。官方说明：https://support.apple.com/en-ie/guide/iphone/iphea86e5236/ios

## v0.2 升级与数据兼容

**主 localStorage key 保持 `haoxuan-training-log:v1`，内部 version 仍为1。** v0.2 是应用版本，JSON 计划版本另见下文。

原结构：

```text
{ version:1, templates:{A,B,C,D}, records:{"日期_类型":Workout},
  sleep:{"日期":LegacySleep}, gym, ... }
```

旧 sleep 实际为顶层 `sleep[date]`，不是 Workout 内字段。已核对源代码，没有独立 recovery 集合。旧键：bed / asleep / wakes / wake / hours / nap / caffeine / rating0…rating5 / notes。旧版共用了训练日期，并在力量摘要尾部追加 sleep，这两处在 v0.2 均已解耦。

启动时从旧 sleep 逐字段补齐 dailyStatusByDate。日期已有但字段缺失也会补齐；null/undefined/空字符串视为缺失，已有新值（包括0）保留。旧 sleep 和 Workout 原文不修改，重复迁移结果一致。没有 storage 时仅浏览页面不创建空存储。完整来源和限制见 [STORAGE-AUDIT.md](STORAGE-AUDIT.md)。

### Daily Status schema

```json
{
  "date": "2026-09-07",
  "bedtime": "",
  "sleepTime": "",
  "nightAwakenings": null,
  "wakeTime": "",
  "estimatedSleepHours": null,
  "napMinutes": 0,
  "lastCaffeineTime": "",
  "wakeEnergy": null,
  "morningFocus": null,
  "afternoonFocus": null,
  "muscleSoreness": null,
  "trainingMotivation": null,
  "daytimeSleepiness": null,
  "notes": "",
  "updatedAt": null
}
```

集合位置为根对象 `dailyStatusByDate[date]`。时间为 HH:mm 或空字符串；数字/评分未填为 null；新记录午睡默认0，可清空为 null。用户修改后 updatedAt 为 ISO 时间；旧数据迁移时没有可靠的更新时间，保持 null。

映射：bed→bedtime，asleep→sleepTime，wakes→nightAwakenings，wake→wakeTime，hours→estimatedSleepHours，nap→napMinutes，caffeine→lastCaffeineTime，rating0…5 按上述六个评分字段顺序映射。数字字符串转为数字；原始 legacy 值仍完整保留。

日期表示状态所描述的那一天，例如9/7记录包含9/6晚到9/7早的睡眠和9/7白天/晚上的状态。状态页面日期独立于 Workout 的日期与 A/B/C/D。估计睡眠时长（0也算有值）和六个评分全部有值时显示“已完整”，否则“未完整”；任何情况下都可生成状态反馈。

训练摘要只包含训练。状态只从“生成今日状态反馈”导出，不会附加到力量或有氧摘要。查看未填写的日期不会把空 Workout 保存到历史。

## 正式 Plan Import schema：haoxuan-training-plan / version 1

只接受 JSON；解析前仅 trim、去开头 BOM、移除完整最外层 Markdown 代码围栏，不修改正文，不修补错误 JSON，不执行内容。仍使用 JSON.parse；未知字段、未知版本和字段类型错误都会拒绝。解析/预览不写入存储，确认前可返回修改或取消。

### 公共字段

| 字段 | 要求 |
|---|---|
| schema | 必须为 `haoxuan-training-plan` |
| version | 数字 `1` |
| date | 真实存在的 YYYY-MM-DD 日期，1900–2199 |
| type | A / B / C / D |
| kind | strength / cardio；cardio 必须配 type D |
| gym | 非空字符串，最多200字 |
| title | 可选字符串，最多200字，默认空 |
| notes | 可选字符串，最多5000字，默认空 |
| exercises | strength 必须有1–30个动作，不能同时有 cardioOptions |
| cardioOptions | cardio 必须有1–3个方案，不能同时有 exercises |

输入 JSON 长度上限100000字符。所有数字必须为 JSON number、有限且在下列范围内，不能使用数字字符串、NaN、Infinity 或负数。用户输入的名称/说明作为文本显示，不执行 HTML/脚本。

### Strength exercise

| 字段 | 要求 |
|---|---|
| nameZh / nameJa / nameEn | 必填非空字符串，各最多200字 |
| weight | 必填，0–2000的数字或 null；null 表示不预设重量 |
| weightUnit | 必须为 kg |
| weightMode | machine（机器显示重量）/ total（总重量）/ per-side（单侧重量）/ bodyweight（自重或附加重量） |
| sets | 1–20的整数 |
| repMin / repMax | 1–999的整数，repMin ≤ repMax |
| restSeconds | 可选0–3600整数，默认0，表示未安排休息时长 |
| instructions | 可选字符串，最多5000字，默认空 |

完整可复制示例：[examples/strength-plan.json](examples/strength-plan.json)。该示例含一个动作，只展示导入格式，不代表完整训练建议。

```json
{
  "schema": "haoxuan-training-plan", "version": 1,
  "date": "2026-09-08", "type": "A", "kind": "strength",
  "gym": "Anytime豊玉桜台", "title": "胸・肩・三頭",
  "notes": "今天保持RIR1–2。",
  "exercises": [{
    "nameZh": "坐姿推胸", "nameJa": "チェストプレス", "nameEn": "Chest Press",
    "weight": 40, "weightUnit": "kg", "weightMode": "machine",
    "sets": 3, "repMin": 8, "repMax": 12,
    "restSeconds": 120, "instructions": "肩胛稳定，不耸肩。"
  }]
}
```

### Cardio option

| 字段 | 要求 |
|---|---|
| id | treadmill / elliptical / bike，数组内不得重复 |
| nameZh / nameJa / nameEn | 必填非空字符串，各最多200字 |
| durationMin | 1–300整数；该方案目标分钟数，不是区间下限 |
| targetRpeMin / targetRpeMax | 1–10有限数字，最小值 ≤ 最大值 |
| inclineMin / inclineMax | treadmill 必填，0–40，最小值 ≤ 最大值 |
| speedMin / speedMax | treadmill 必填，0.1–30 km/h，最小值 ≤ 最大值 |
| resistance | 可选字符串，最多200字，默认空，供椭圆机/健身车使用 |
| instructions | 可选字符串，最多5000字，默认空 |

非跑步机方案不能包含坡度/速度字段。第一项为默认方案；只显示本计划提供的方案，不自动补入其他方案。继续使用既有 cardio.selected / cardio.entries 结构，切换保留各自草稿，完成状态只对应选中的一个方案。

完整示例（包含跑步机及健身车备选）：[examples/cardio-plan.json](examples/cardio-plan.json)。

```json
{
  "schema": "haoxuan-training-plan", "version": 1,
  "date": "2026-09-09", "type": "D", "kind": "cardio",
  "gym": "Anytime豊玉桜台", "title": "有氧",
  "cardioOptions": [{
    "id": "treadmill",
    "nameZh": "跑步机坡度快走", "nameJa": "トレッドミル傾斜ウォーキング",
    "nameEn": "Incline Treadmill Walk",
    "durationMin": 45, "inclineMin": 10, "inclineMax": 12,
    "speedMin": 4.8, "speedMax": 5.2,
    "targetRpeMin": 6, "targetRpeMax": 7, "instructions": "不扶扶手。"
  }]
}
```

## Plan / Actual 分离与冲突保护

导入记录额外保存 `plan`（验证后的计划快照）、`planSource: "chatgpt-import"`、`importedAt`（ISO时间）。不保存原始粘贴文本或 ChatGPT 对话，不改 A/B/C/D 模板。

力量动作的 recommendedWeight 是建议值；旧兼容字段 exercise.weight 也保留建议值。set.weight 是输入草稿/实际记录值，初始可预填，set.done 表示本组确认。修改任何力量/有氧执行字段会写 actualTouched，并保留现有 updated 标记，即使后来改回默认值也不会再被当成空计划。实际修改不回写 plan/recommendedWeight。

有氧 plan.cardioOptions 保存目标；cardio.entries 保存各方案执行草稿，目标与实际分离。第一方案时间预填 durationMin，跑步机坡度/速度预填目标最小值；RPE、体感等仍需用户记录。旧没有 kind 的记录按 strength 读取；旧 cardio 没有 plan 时仍使用原有三个方案。

确认导入前重新读取 localStorage，判断：

- 目标不存在：创建。
- 目标无实际输入：预览明确显示“当天已有未开始计划，是否替换？”，按钮为“确认替换并导入”；只有点击后覆盖。
- 存在 actualTouched、updated、完成标记、次数、RIR、修改的重量、有氧执行数据或反馈：显示“该日期已有训练数据，无法覆盖”，禁用确认。
- 旧记录无法明确判断是否为空时，保守阻止覆盖（包括旧备注）。不猜测、不合并。
- 预览后其他窗口改变目标：确认时重新检查，并要求返回重新解析；新出现的实际数据绝不覆盖。其他日期和每日状态从最新存储保留。

验证失败、取消、预览、冲突不会写存储。写入失败不清除原存储。计划导入不合并或删除真实记录；备份导入另走预览后补缺合并流程。

## PWA 更新和数据边界

当前 CACHE：**haoxuan-shell-v12**。发布本目录完整应用文件，必须包含 storage-compat.js、data-recovery.js、pwa-ui.js 和 examples 两个 JSON。缓存包含全部应用脚本和两个示例；tests/README 不加入运行缓存。

保持联网打开原来的 Safari/PWA 入口等待下载，再关闭该站点所有 Safari 标签页并划掉主屏幕 App，然后重开，使新 Worker 激活。不要清除网站数据，不要删除 PWA。manifest 和图标不变。

数据只在当前来源/当前浏览器本地保存，不跨设备同步；域名、协议、端口或Safari/PWA入口不同可能使用不同存储空间。清除网站数据、隐私模式或系统回收可能丢失 localStorage，不能保证永久保存；建议定期在数据诊断导出完整备份。升级会在你设备首次加载v0.2.1时迁移，开发环境测试不能直接读取你iPhone的真实数据。

## 验证

见 TESTING.md。主要测试：

```sh
# 需已安装 Playwright 及 Chromium/WebKit；可通过 NODE_PATH 使用外部安装。
TEST_URL=http://localhost:8000 node tests/run.cjs
```

测试使用隔离浏览器存储和样本记录。手机尺寸/键盘可用空间为模拟，实际 iPhone Safari/PWA 的系统键盘、安全区和安装需设备确认。


## v0.2.1 数据诊断与备份恢复

历史记录 → **数据诊断**：显示 origin、Safari/Browser/主屏幕环境、key是否存在、JSON UTF-8字节数、实际root keys、legacy sleep和Daily Status天数、标准化训练数量、A/B/C/D与Strength/Cardio统计、最早/最新日期、模板数量、未识别条目和同日重复候选。原始概览仅列键名、类型和数量，不自动展开私人训练内容。

**导出全部数据** → **复制备份JSON**。这是只读操作，data 是当前 key 完整对象副本，包含未知字段和 legacy 数据：

```json
{
  "schema": "haoxuan-training-log-backup",
  "version": 1,
  "exportedAt": "2026-09-07T12:00:00.000Z",
  "origin": "https://example.github.io",
  "environment": "standalone",
  "data": {}
}
```

`data:{}` 仅演示信封结构，导出时会包含完整真实对象。JSON损坏时改为“保留原始存储”，仍可复制原文；它不是有效标准备份，不能直接自动合并。

**导入备份** → 粘贴 → 解析 → 验证/预览 → **确认合并**。只合并缺失数据：已有实际训练保留，实际训练胜过空计划，已有新每日状态字段优先，模板/其他根字段补缺。双方同日同类型均有实际数据则报告冲突并禁止整个导入，本轮没有逐组merge或强制覆盖。预览不写storage；确认时重新核对存储未变化。单份备份上限10MB；无法识别的训练结构不会冒险合并。

历史识别不到时先看诊断，不要清除网站数据。Safari和主屏幕入口可能对应不同存储环境；在仍能看到旧记录的环境导出备份，再到目标环境预览合并。不要求删除PWA或清除Safari数据。没有旧storage或备份时无法自动重建真实历史：**无法确认自动恢复，需要通过数据诊断或备份恢复。**

## 示例与导入体验

导入弹窗提供“载入力量示例 / 载入有氧示例”，只填文本，不自动解析/导入。继续点击解析计划查看预览，再确认。两个 examples 文件本身都是严格、无BOM的UTF-8 JSON，格式schema仍为 haoxuan-training-plan / version 1。错误JSON显示可取得的position或行列信息；没有位置时提示复制完整JSON，不记录全文日志。

导入入口独立留白，弹窗上限90dvh，固定关闭区与内部滚动区域配合可视视口；示例按钮、摘要卡、动作预览和确认区分别留出间距。现有训练/每日状态控件几何和manifest保持不变。


## v0.2.2：顶部与空状态 UI 修复

本轮不修改存储、迁移、模板、历史选择器、导入/备份或摘要逻辑。完整 UI 审计与测试见 [UI-AUDIT-v022.md](UI-AUDIT-v022.md)。

- 页面顶部通过 body 的 `padding-top: env(safe-area-inset-top, 0px)` 在文档流留白，无顶部 fixed overlay。
- 唯一的应用 blur 原在底部 nav，源码/自动测量未发现顶部滤镜层。为排除固定滤镜的 WebKit 合成干扰，底部导航改为不透明白色，去掉 backdrop-filter；位置、按钮、底部安全区保持不变，CSS 限定到 .bottom-nav。
- 空状态保持原 card 边框、圆角、padding、字号，显式使用纵向 flex 居中；标题/说明均满宽居中、无缩进。修复前桌面引擎的几何中心本就正确，不能声称复现了实机光学偏移。

**顶部 blur 的真实 iPhone 视觉效果仍需实机确认。** 请在相同主屏幕 PWA 入口联网载入新版后，关闭该站点所有窗口再重开，让 v9 Worker 激活；不需要卸载、重装或清除网站数据。


## v0.2.3：普通 standalone 视口与垂直文字组

当前 `apple-mobile-web-app-status-bar-style` 原本就是 `default`，并非 black-translucent，本轮未改。viewport改为 `width=device-width,initial-scale=1`，移除cover；同时移除v0.2.2的body顶部safe-area padding，避免与系统自动内缩叠加。底部导航白底、按钮和safe-area-bottom规则保持。历史v0.2.2章节说明的是上版行为，本节为当前策略。

“数据诊断”底部新增 **iOS / PWA UI Diagnostics**，只读显示11项meta/运行模式/安全区/视口信息，并随尺寸变化刷新。这个面板显示当前文档，不代表可以读取系统安装缓存。

空状态文字整体改用wrapper纵向居中：消除旧说明段落末尾margin造成的可见组偏上7px；文字间gap20px，卡片高度、padding、字号等保持。

详细配置表、测试结果和边界见 [UI-AUDIT-v023.md](UI-AUDIT-v023.md)。**顶部 blur 的真实 iPhone 视觉效果仍需实机确认。** 本轮没有修改status-bar-style，因此不要求重新安装；先联网更新现有PWA验证。如日后决定重新添加，先导出全部数据备份，不直接删除或清除网站数据。


## v0.2.4：Standalone Scroll Edge Workaround（历史；已在v0.2.5移除）

viewport、status-bar-style、theme-color与manifest不变，不恢复cover、不添加body顶部safe-area padding。

仅standalone（media query或navigator.standalone）启用真实DOM `#pwa-top-edge-guard`：fixed top0、1px高、#f3f5f4实色、pointer-events:none；普通browser完全隐藏。无blur、透明度或渐变。这是可撤销workaround，不能视为已确认系统根因或实机blur已解决。

Empty State gap从20px减至10px；group外边距对称补足原有高度，card大小和centerY不变。底部导航padding改为 `max(env(safe-area-inset-bottom,0px),14px)`；实际nav高度通过border-box观察同步到正文与滚动避让。env=0时原8px变为14px，实际向上约6px；不额外叠加comfort。

UI Diagnostics新增guard active/inactive及rect、bottom inset、comfort、nav实际bottom padding。当前CACHE **haoxuan-shell-v11**。完整结果见 [UI-AUDIT-v024.md](UI-AUDIT-v024.md)。

**已在项目中部署scroll-edge workaround，等待真实iPhone验收。** 只需联网更新现有PWA，不清storage、不删除或重新安装。模拟测试无法证明系统级scroll-edge blur已关闭。


## v0.2.5：Final Mobile UI Polish — 基础 UI 冻结

依据真实iPhone反馈，guard无效，已完整移除其DOM/CSS/启用逻辑/诊断和专项测试。保留其它PWA viewport诊断。顶部模糊作为当前iOS standalone系统视觉行为接受，不再增加workaround，也不改viewport/status-bar/顶部safe-area。

Empty State gap最终6px，group仍上下居中且card几何不变。导航字符图标旧字号21px，现为统一24×24px、1.8px线宽SVG（名义尺寸+14.3%）；保留原图形含义、按钮/导航高度、标签位置及14px底部comfort。原字符仅作为不可见的字体行盒占位，避免导航高度因替换SVG变化。

数据逻辑完全不变。当前CACHE **haoxuan-shell-v12**，无需清数据或重装PWA。详细测量与测试见 [UI-AUDIT-v025.md](UI-AUDIT-v025.md)。基础UI以v0.2.5冻结，今后仅根据明确新需求调整。
