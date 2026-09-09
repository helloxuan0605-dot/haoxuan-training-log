# Haoxuan Sleep Export
## iPhone 快捷指令设置指南

本项目无法生成或签名一个可直接安装的 Apple Shortcut 文件。请在 iPhone「快捷指令 / Shortcuts」中手动建立 **Haoxuan Sleep Export**。Training Log 网页没有 HealthKit Web API，不会请求 Health 权限，不会上传睡眠数据。

Apple 官方确认 Find Health Samples 可以返回 Core、Deep、REM 睡眠阶段。不过动作名称、筛选器和详情字段会随 iOS 版本、系统语言、数据来源及 Apple Watch 状态变化。本指南描述步骤和计算规则，不保证你会看到完全相同的菜单。无法取得的字段输出 `null`，或省略该可选字段；不要填字符串 `"null"` 或用 0 代替未知。

## 1. 创建查询窗口

1. 新建快捷指令，命名 **Haoxuan Sleep Export**。
2. 添加 Date / 日期（日本語约「日付」），取得当前日期，作为起床日。用 Format Date（约「日付をフォーマット」）输出 `yyyy-MM-dd`，保存为 `SleepDate`。回补历史时，可用 Ask for Input（约「入力を要求」）选择起床日期，后续窗口都用这个日期。
3. 用 Adjust Date（约「日付を調整」）取得该日期的日初。日初加 12 小时得到 `WindowEnd`；日初减 1 天、加 18 小时得到 `WindowStart`。应当按本地日历日期运算，不要用「现在减18小时」替代。
4. 验证示例：起床日 2026-09-10，窗口为 9/9 18:00 → 9/10 12:00。窗口覆盖跨午夜睡眠，排除午后的午睡。晚起超过12点时主动扩展窗口，避免漏记；午睡仍在 App 的午睡分钟里单独填写。
5. 输出时间使用 Format Date 的 ISO 8601（带偏移）或自定义 `yyyy-MM-dd'T'HH:mm:ssXXX`，例如 `2026-09-10T01:05:00+09:00`。年月日使用小写 `yyyy`，分钟使用 `mm`。不要输出本地化日期或没有时区的时间。

## 2. 从健康读取 Sleep 样本

1. 添加 **Find Health Samples**（日文大致「ヘルスケアサンプルを検索」），类型选择 **Sleep / 睡眠**。
2. 查询窗口内的样本，按开始日期从早到晚排序，不设条数上限。目标是取得所有满足 `sample.start < WindowEnd` 且 `sample.end > WindowStart` 的交叠样本。
3. 如果当前 iOS 筛选器只支持按天或开始日期筛选：先扩大到前一天及起床日（必要时更早），再在 Repeat with Each（约「各項目を繰り返す」）中用 If（「もし」）检查上述交叠条件。不要只查「今天」，也不要漏掉跨午夜的样本。
4. 循环内用 **Get Details of Health Sample**（约「ヘルスケアサンプルの詳細を取得」），或点样本变量选择详情，读取 Start Date、End Date、Value/睡眠分类、Source（若提供）。字段不可用就留空，不要索取不相关的健康数据。
5. 第一次运行时 iOS 会要求健康数据访问权限。只授权睡眠读取；不需要写入健康、心率、医疗记录等权限。权限界面随系统版本变化。

## 3. 方案 A：汇总阶段（推荐）

在循环外用 Number / Set Variable 建立各阶段累计分钟数；同时保留「是否能识别该类别」标记。循环内用 If 按 Value 分类、Get Time Between Dates（约「日付間の時間を取得」）取分钟、Calculate（「計算」）累加。不要把数值变量格式化成带单位的字符串。

每条样本先裁到窗口：`start = max(sample.start, WindowStart)`，`end = min(sample.end, WindowEnd)`，持续分钟为 `(end - start) / 60秒`。Shortcuts 中可用 If 和 Set Variable 选择两者较晚/较早者，再求时间差。

- **REM / Core / Deep / Asleep Unspecified**：分别累加到 `remMinutes` / `coreMinutes` / `deepMinutes` / `asleepUnspecifiedMinutes`。总睡眠只累计真正睡着的样本。
- **Awake**：累计到 `awakeMinutes`，不计入睡眠总时长。
- **In Bed**：单独记录 `inBedMinutes` 和最早 `inBedStart`，不能加到总睡眠或睡眠阶段上。很多数据源不提供卧床，输出 null 即可。
- `firstSleepStart` 为本窗口最早睡着样本的开始，`finalWakeTime` 为最后睡着样本的结束。这是样本边界估计，未必等于用户真正离床时间；请在预览核对。
- `awakeEpisodeCount` 不是 Awake 样本行数。如果不能确认相邻/拆分样本已合并为独立醒来事件，就输出 null，之后手填醒来次数。
- 已确认该数据源提供完整阶段分类、但某阶段没有样本时可以输出 0；无法确认是否有该阶段数据时输出 null。

**不要简单把所有来源相加。** 优先由用户选择一个可识别来源并核对 Health 中的总睡眠；能筛选 Source 时可筛选。不能筛选或确认时，可以保留多个 `sourceNames`，App 将提示多来源，但不会去重。重叠的「Asleep」总段与 Core/Deep/REM 分段也不能重复累加：只有能确认是独立未分期睡眠的样本才计入 Asleep Unspecified。无法区分时使用方案 B，并先核对可得到的总睡眠；没有可信总时长就输出 null，不把入睡到起床的时差当成总睡眠。

然后建立 **Dictionary / 辞書**：

- 顶层 `schema`（Text）=`haoxuan-health-sleep`，`version`（Number）=1，`date`（Text）=`SleepDate`，`source`（Text）=`apple-health-shortcuts`。
- `dataWindowStart` / `dataWindowEnd` 用刚才格式化的 ISO 时间。
- `sleep` 为嵌套 Dictionary，放入各已知时间文本和分钟数 Number。
- `sourceNames` 为 List（列表），只放来源名称，不放 UUID、序列号、Apple ID 或日志。
- 用 **Get Text from Input**（约「入力からテキストを取得」）取得 Dictionary 的 JSON 文本。用 **Get Dictionary from Input**（约「入力から辞書を取得」）回读一次检查，再转文本，Quick Look / Show Result 查看结果。

若你的 Dictionary 编辑器不能表达 JSON null，不要填空文字冒充 null：省略可选字段，Importer 会规范化为 null。也可以采用下面的固定 JSON Text 模板，其中未知字段保留字面量 null。必须检查最终输出为严格 JSON，而不是词典展示文字；示例文件可作为对照。

## 4. 方案 B：最低可用版本

只汇总可确认的 `firstSleepStart`、`finalWakeTime`、`totalSleepMinutes`。阶段计算困难时全部留 null。不要将卧床跨度误作总睡眠。没有记录时不应制造示例数值。

在 Text（「テキスト」）动作中使用下面模板。三个已知值替换为快捷指令的变量；日期和 ISO 时间变量放在引号中，分钟数变量不要引号，确保小数点为 `.`。若时间也取不到，用不加引号的 null 替换整项值。随后 Get Dictionary from Input 验证，再 Get Text from Input 序列化。

```json
{
  "schema": "haoxuan-health-sleep",
  "version": 1,
  "date": "2026-09-10",
  "source": "apple-health-shortcuts",
  "sleep": {
    "firstSleepStart": "2026-09-10T01:05:00+09:00",
    "finalWakeTime": "2026-09-10T09:00:00+09:00",
    "totalSleepMinutes": 440,
    "remMinutes": null,
    "coreMinutes": null,
    "deepMinutes": null
  }
}
```

这里的日期和数字仅为格式示例，不能代替用户真实数据。完整示例：[health-sleep-full.json](examples/health-sleep-full.json)；所有未知值显式 null 的简化示例：[health-sleep-minimal.json](examples/health-sleep-minimal.json)。

## 5. 复制并导入

1. 最后添加 **Copy to Clipboard**（约「クリップボードにコピー」）。如系统提供「仅限本地 / Local Only」选项，可启用，避免通过通用剪贴板跨设备复制。
2. 可选添加 **Open URLs**（约「URLを開く」），URL 为 `YOUR_TRAINING_LOG_URL`，替换成你实际的 GitHub Pages 地址。它可能打开 Safari；若数据一直存在主屏幕 App，请回到主屏幕 App 导入，不要混淆两个存储环境。
3. 每日状态 → 从 Apple 健康导入睡眠 → 从剪贴板读取 → 核对日期、时间、来源、总睡眠和字段对照 → 确认导入。读取权限拒绝时，点文本框长按粘贴，再解析。
4. 默认只补空值。高级替换只作用于五项客观睡眠字段；主观评分、备注、咖啡因、午睡永远保留。同一天再次导入需明确确认替换 Health 数据。
5. 晚上补主观状态并生成今日状态反馈，复制给 ChatGPT。App 不根据睡眠决定训练、重量或恢复评分。

## 6. 实机验收与数据边界

请在真实 iPhone 验证：睡眠读取授权；阶段分类/来源字段；JSON 数值与 null 序列化；夜间跨日窗口；剪贴板权限及手动粘贴；Safari/主屏幕实际使用环境；与 Health 总量核对。自动浏览器测试不能代替这些步骤。本项目未提供可安装 .shortcut 文件。

Training Log 不上传健康数据，保存仅在当前 origin、当前浏览器环境的 localStorage。系统清理、用户清除网站数据等仍可能造成丢失，请使用「导出全部数据」备份。移除 Apple Health 卡片只删除 `healthSleep`，保留已填客观字段和主观状态，避免误删后来手动修改的内容。

## Apple 官方参考

- [Shortcuts 更新：iOS 16.2 支持睡眠阶段](https://support.apple.com/en-au/101583)
- [Find / Filter actions](https://support.apple.com/en-sa/guide/shortcuts/apd3c845e881/ios)
- [使用 Dictionary](https://support.apple.com/en-au/guide/shortcuts/apd43b69f337/ios)
