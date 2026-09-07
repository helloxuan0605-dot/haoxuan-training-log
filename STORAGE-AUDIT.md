# v0.2.1 Storage / Migration Audit

## 证据范围

本轮检查了当前项目、保留的 v0.1 源码快照（before-polish、before-root-fix）、cardio 后/v0.2 前快照（before-v02）、本次修改前快照（before-v021）、测试和 README。工作目录及目标项目没有可用 Git 历史，因此不能声称通过 Git 提交证明线上发布顺序。未读取真实 iPhone 的 localStorage；模拟 fixture 不是用户真实历史。

## 源码中实际使用过的 root fields

| 阶段 | 根字段 | 含义 |
|---|---|---|
| v0.1 strength | version | 内部版本 1 |
| v0.1 strength | templates | A/B/C/D 数组；最初仅 B 有默认动作 |
| v0.1 strength | records | 对象映射；原代码键为 `${date}_${type}` |
| v0.1 strength | sleep | `sleep[date]`；独立根集合，但 UI 共用训练日期 |
| v0.1 strength | gym | 默认健身房字符串 |
| v0.1 后续 | draft | 用户添加模板动作的草稿 |
| cardio 扩展 | 同上 | cardio 位于 record 内，不是 root；record.kind=cardio |
| v0.2 | dailyStatusByDate | 独立每日状态集合 |

没有找到已发布源代码使用 root history、workouts、sessions、currentWorkout、workoutTemplates 或 settings 的证据。v0.2.1 对其中部分提供保守兼容读取，是恢复适配能力，不能当作旧版本真实 schema 的证据。完整真实根键由“数据诊断”直接从当前 storage 读取。

旧力量记录：

```text
records["YYYY-MM-DD_B"] = {
 date, type: "B", gym,
 exercises: [{cn, ja, en, weight, count, range, done,
   sets: [{weight, reps, feel, rir, done}]}],
 feedback: {overall?, stimulus?, pain?, painAreas?, notes?},
 completed, updated?
}
```

`weight` 在动作层是建议值，在 set 层是输入值；初始复制建议值，不能单凭相同预填值断言已训练。没有 kind 的旧力量记录原本就被当作力量训练。

有氧扩展保持 records 容器：`{date,type:"D",kind:"cardio",gym,exercises:[],feedback,completed,cardio:{selected,entries:{[方案ID]:{minutes,incline,speed,resistance,rpe,handrails,feel,legFatigue,pain,notes}}}}`。

v0.2 导入记录另加 plan、planSource、importedAt；建议值/休息/动作说明进入 exercises；actualTouched 标记用户改动。

## 确认的问题与未确认的用户设备原因

1. **严格根校验**：v0.2 必须同时有 records、sleep、templates 和全部 A/B/C/D 数组；否则切到默认内存状态并禁止保存。原数据未删，但页面可能显示默认/空列表。v0.2.1 允许缺少非必要根字段，不能读的结构会明确提示并提供原始导出。
2. **精确 ID 依赖**：旧 history UI 只列 records；点击后仍按 date_type 取记录。v0.2 `record()` 也只按 `records[date_type]` 查找。替代 ID 或其他容器可能被忽略；同日 canonical 空计划会遮住其他位置实际数据。fixture 能复现。原始 v0.1 的标准 date_type 数据在正常同一 storage 中本应可读，没有发现按缺少 kind 过滤它们的代码。
3. **不是已证实的删除事故**：v0.2 没有找到主动删除 9/5 B、9/6 C 的代码。它的未保存计划使用内存 workoutDrafts；不能把所有空记录归因于启动自动持久化。v0.1 则会在 record() 访问时建立内存 db.records 项，并在后续保存时写入。
4. **真实 C 变空**：可能是替代键/容器被遮蔽、根读取失败，或 Safari/主屏幕/来源存储不同；尚无真实 iPhone 备份证明哪一种发生。多个历史、sleep、C模板一起缺失时，更需要先检查 origin/运行环境和完整 root。无法确认自动恢复，需要通过数据诊断或备份恢复。
5. **Daily Status 的确定性迁移 bug**：v0.2 发现新集合已有日期就整条跳过；即使只有 date 或其他字段全空，旧 sleep 也不会补入。v0.2.1 按字段 fill missing：仅 null/undefined/空字符串是缺失，0 和已有新值保留，旧 sleep 原样保留。
6. **A/C 模板**：最早默认 A/C 数组为空；C 曾靠一次性计划注入更新模板，标记另存在 `haoxuan-training-log:plan:2026-09-06-C`。D 注入同样有独立 9/7 标记。v0.2 移除了当日源码注入；未经历该注入/不同存储环境可能没有 C 模板。不能伪造恢复 A/C；无模板不再影响真实历史选择。
7. **示例 JSON**：修改前 strength-plan.json 和 cardio-plan.json 已可直接 JSON.parse、UTF-8、无 BOM，内容本轮没有改。原解析器拒绝最外层 Markdown fence，可复现同类错误；没有真实粘贴文本，不能证明实机就是围栏、截断或旧缓存造成。新入口直接载入同源示例，避免手动复制歧义。

## 旧 sleep 的真实顺序

| 旧字段 | 新字段 |
|---|---|
| bed / asleep / wakes / wake | bedtime / sleepTime / nightAwakenings / wakeTime |
| hours / nap / caffeine | estimatedSleepHours / napMinutes / lastCaffeineTime |
| rating0 | wakeEnergy 起床精神 |
| rating1 | morningFocus 上午专注 |
| rating2 | afternoonFocus 下午专注 |
| rating3 | muscleSoreness 肌肉酸痛 |
| rating4 | trainingMotivation 训练意愿 |
| rating5 | daytimeSleepiness 当天整体困倦 |
| notes | notes |

该顺序来自旧 renderSleep 的 ratings 数组，而非猜测 README。

## v0.2.1 恢复策略

- 所有历史和当前训练经同一个 normalized selector；记录以 date+type 去重显示，实际数据优先于空计划，完成记录优先。未知结构不擅自当成空 exercises。
- 适配器克隆并保留未知属性。只读浏览不持久改写 Workout；用户明确编辑或确认备份恢复后才保存兼容记录。runtime/canonical 标志 compatibilityNormalized 防止下一次读取又把旧 alias 覆盖到用户刚编辑的值上。
- actualWeight/actualReps、RIR、feeling、completed 等兼容别名保留并转为当前控件能读取的 weight/reps/rir/feel/done；缺少 kind 的明确 strength 记录设为 strength。有氧仅识别现有 entries 结构，不猜测陌生 cardio schema。
- 相同预填建议重量/默认有氧目标本身不视为实际执行；实际改动、组完成、RIR、次数、反馈、训练完成等保守认定为实际数据。无法区分旧代码填的反馈和用户反馈时，以保护为先。
- 不删除 shadow/raw；读取 actual 候选。用户编辑非 canonical 历史时生成 canonical 更新，旧来源保留。旧 records 数组在确认写入时保留到 recoveryLegacyRecords。
- 备份双方同日同类型都有实际训练时，整个合并中止；不默认选一份。预览后检查原始 storage 字符串，防止其他窗口变化后错误确认。
- 未识别 workout、损坏 JSON、陌生根版本/状态集合格式不能自动恢复；提供只读诊断和原始文本复制。没有同源数据且没有备份，也无法凭源码重建实际组数/重量/状态。
- 不自动修改模板来冒充历史；无计划/模板显示“今天还没有训练计划”。
