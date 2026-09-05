# Haoxuan Training Log

移动端优先的原生 HTML / CSS / JavaScript PWA。无框架、构建依赖、后端、数据库或账号。训练和睡眠记录均自动写入 localStorage。

## 本地启动

在此文件夹打开终端，运行：

```sh
python3 -m http.server 8000
```

电脑浏览器打开 http://localhost:8000 。这只是静态文件预览，不是应用后端。请不要直接双击 index.html：file:// 下无法正常注册 Service Worker，存储和复制行为也可能受限。

同一 Wi-Fi 下，iPhone 可访问 `http://电脑局域网IP:8000` 预览布局；普通局域网 HTTP 不支持完整的 Service Worker / Clipboard API。请用下述 GitHub Pages HTTPS 地址测试离线和主屏幕安装。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库，例如 `haoxuan-training-log`。
2. 把本文件夹内的所有文件放进仓库根目录，包括 `icons/`、`.nojekyll`、`manifest.webmanifest` 和 `sw.js`。确保 `index.html` 直接位于根目录，不要再套一层文件夹。
3. 在仓库 **Settings → Pages → Build and deployment** 中选择 **Deploy from a branch**，分支选 **main**，文件夹选 **/(root)**，保存。
4. 等待 Pages 发布完成，打开 `https://你的用户名.github.io/haoxuan-training-log/`。
5. 此项目使用相对资源路径、相对 manifest scope 和 Service Worker 路径，适用于 GitHub Pages 的仓库子目录，不需要修改 base URL。

官方说明：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## iPhone 添加到主屏幕

1. 使用 Safari 打开部署后的 HTTPS 地址，保持联网，等待首次加载完成。
2. 打开分享菜单，选择“添加到主屏幕”。若有“作为网页 App 打开”选项，保持开启。
3. 从主屏幕图标启动。首次成功缓存后可离线记录；可用飞行模式再次打开验证。

Apple 说明：https://support.apple.com/en-ie/guide/iphone/iphea86e5236/ios

## 使用方式

- 默认今日 B 日，健身房默认 `Anytime成增`，可修改。日期按设备本地日期生成。
- 每个日期和训练类型各有一条记录；切换 A/B/C/D 会打开独立记录，不覆盖其他类型。一天同类型只保存一场训练。
- B 日已配置指定的五个动作，共 12 组。二头弯举没有预设重量，需自行填写。
- A/C/D 尚未提供动作安排，可通过“添加预设动作”填写三语名称、重量、组数、次数范围。新日期会使用保存的模板；已建立的历史记录保留自己的动作快照。
- 重量 +/- 每次 2.5 kg；数字框可直接输入 21.25 等小数。次数 +/- 每次 1。重量 0 可表示自重或无附加负重。
- 填好重量、次数、体感和 RIR 后才能完成本组；所有组完成后才能标记动作完成；所有动作完成后才能结束训练。
- 修改已完成组会撤销该组、动作和训练的完成状态，需重新确认。体感和 RIR 均没有默认值，避免误记。
- 关节疼痛选“有”后可多选部位；改为“无”会隐藏部位，摘要也不再包含它们。
- 睡眠记录以起床当天为日期，午睡按分钟记录，总睡眠按小时手动估计。1–5 为对应指标从低到高，酸痛/困倦高分表示更强。
- “生成训练反馈”包含每组重量、次数、体感、RIR、完成情况、训练反馈和当日睡眠记录。未完成数据会明确标出。
- “复制到剪贴板”优先使用 Clipboard API；不可用时尝试兼容复制，再提供长按选中文本的操作提示。
- 历史列表可重新打开、修改记录并生成反馈，不包含图表。

## 自动保存与数据边界

localStorage 键名为 `haoxuan-training-log:v1`，保存模板、训练历史、睡眠和最近健身房。有效字段输入、选择与完成按钮立即保存，无需额外保存按钮；刷新、正常关闭并重新打开同一浏览器会恢复数据。负数、超限和非整数次数等非法数值不会写入。

所有数据仅保存在当前浏览器的当前来源中，不上传、不跨设备同步。清除网站数据、卸载相关网页 App、隐私浏览或系统回收网站数据可能导致丢失；localStorage 无法保证永久保存。Safari 与主屏幕 App 的数据空间可能不同，建议固定使用同一入口。域名/协议/端口变化也会形成不同存储空间。建议定期复制训练反馈到自己的笔记中备份。

存储空间不足会显示保存失败；无法读取现有存储时停止覆盖，防止破坏原数据。其他同源窗口保存后会同步到当前界面；同时编辑同一记录仍以最后一次保存为准。

## PWA 文件与更新

- `manifest.webmanifest`：独立窗口显示、相对启动地址、192/512 PNG 图标。
- `icons/apple-touch-icon.png`：180×180 iPhone 主屏幕图标。
- `sw.js`：缓存完整本地应用外壳；在线优先，离线回退缓存；不请求 CDN 字体或外部服务。
- 发布新版时修改 `sw.js` 的 `CACHE` 版本（如 `haoxuan-shell-v2`）。关闭所有旧 App/网页窗口后再打开，使新 Worker 激活。更新缓存不会删除 localStorage 记录。

## 验证

详细测试结果见 `TESTING.md`。桌面 WebKit 模拟移动视口不能替代真实 iPhone 的安装、系统键盘、剪贴板权限与安全区验证。
