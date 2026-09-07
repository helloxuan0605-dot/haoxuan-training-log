# Haoxuan Training Log v0.2

原生 HTML / CSS / JavaScript，移动端优先的本地 PWA。无服务器后端、数据库、账号、AI 推断或外部请求。Workout 与 Daily Status 独立；训练计划通过本地 JSON 解析、预览、确认导入。

## 推荐工作流

晚上：打开“每日状态” → 选择描述的当天日期 → 填写睡眠、精力与恢复 → 生成今日状态反馈 → 复制给 ChatGPT。

ChatGPT 根据今日状态、最近训练反馈及 A→B→C→D 循环生成明日计划 JSON。App 自身不决定训练类型、增重、减量、热量或训练处方。

第二天：今日训练 → 导入今日计划 → 粘贴 JSON → 解析计划 → 查看预览 → 确认导入 → 训练 → 生成独立训练反馈 → 复制给 ChatGPT。

每个日期＋训练类型最多一条 Workout；同一天不同类型可独立保存。历史列表仅显示 Workout，每日状态用自己的日期选择器回看。

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

启动时复制缺失日期到 `dailyStatusByDate`，日期原样保留；旧 `sleep` 不删除、不修改。目标日期已存在时，即使新记录只填了一部分，也不会被旧值覆盖。按日期是否存在判断，重复打开不会重复迁移。迁移只扩展状态集合，不改 records/templates；以前硬编码的9/6、9/7计划注入已退出启动流程。

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

只接受原始 JSON，不接受自然语言、Markdown代码围栏、eval 或可执行代码。解析使用 JSON.parse；未知字段、未知版本和字段类型错误都会拒绝。解析/预览不写入存储，确认前可返回修改或取消。

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

验证失败、取消、预览、冲突不会写存储。写入失败不清除原存储。App没有合并或删除真实记录的功能。

## PWA 更新和数据边界

当前 CACHE：**haoxuan-shell-v7**。发布需更新 index.html/app.js/cardio.js/styles.css/sw.js，并包含新增 daily-status.js、plan-import.js。缓存包含全部应用脚本；examples/tests/README 不属于运行所需缓存。

保持联网打开原来的 Safari/PWA 入口等待下载，再关闭该站点所有 Safari 标签页并划掉主屏幕 App，然后重开，使新 Worker 激活。不要清除网站数据，不要删除 PWA。manifest 和图标不变。

数据只在当前来源/当前浏览器本地保存，不跨设备同步；域名、协议、端口或Safari/PWA入口不同可能使用不同存储空间。清除网站数据、隐私模式或系统回收可能丢失 localStorage，不能保证永久保存；建议定期复制反馈备份。升级会在你设备首次加载v0.2时迁移，开发环境测试不能直接读取你iPhone的真实数据。

## 验证

见 TESTING.md。主要测试：

```sh
# 需已安装 Playwright 及 Chromium/WebKit；可通过 NODE_PATH 使用外部安装。
TEST_URL=http://localhost:8000 node tests/run.cjs
```

测试使用隔离浏览器存储和样本记录。手机尺寸/键盘可用空间为模拟，实际 iPhone Safari/PWA 的系统键盘、安全区和安装需设备确认。
