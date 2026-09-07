# v0.2.2 UI Audit — 2026-09-07

## 范围与结论

仅修改 CSS、nav 的 class、Service Worker CACHE、文档和测试。app.js、cardio.js、daily-status.js、storage-compat.js、data-recovery.js、plan-import.js、manifest、examples 逐字节不变；测试用 SHA-256 校验。没有操作真实 iPhone 存储。

**不能从本机源码和移动视口证明真实 iPhone 顶部模糊的完整根因。** 已确认以下事实并据此做局部修复，未用 z-index 或 overflow 隐藏内容。

## 修复前的 CSS/DOM 审计

已搜索 filter/backdrop-filter/blur、fixed/sticky/top、伪元素、mask/gradient/shadow、transform/translate/will-change/opacity；审计对象包含 html/body、header/main、卡片、nav、toast、dialog/backdrop 和弹窗 header。

| 位置 | 实际规则 | 结论 |
|---|---|---|
| nav | position:fixed; bottom:0; backdrop-filter:blur(12px) | 唯一的应用 blur，原背景 #fffffff5；没有设置 top |
| #toast | fixed; bottom:100px; translateX(-50%) | 底部消息定位，无滤镜 |
| dialog | 原生模态 top layer | 仅打开时覆盖；backdrop 是纯色半透明，无 blur |
| header.brand、main、body | static；filter:none；transform:none | 无顶部 fixed/sticky/filter layer |
| .mark / .mark span | relative / absolute | 仅 Logo 内箭头定位，不是 viewport overlay |
| button:active | scale(.98) | 仅按压反馈，不作用于页面容器 |
| .set.done > .row | 5px 浅绿 box-shadow | 完成组提示，不是顶部磨砂层 |
| opacity | 仅 disabled button | 不是顶部内容模糊来源 |

未发现全局 glass、body::before、顶部 mask/gradient、translateZ(0) 或 will-change 硬件加速层。

390×844 修复前：Chromium nav rect top=767、height=77；WebKit top=772、height=72。滤镜矩形确实位于底部，不能把它描述成“已发现顶部错误 selector”。大型页面容器无滤镜/transform。页面虽然 viewport-fit=cover，却没有 safe-area-inset-top 的文档流留白，这是确定的安全区缺口；是否与实机截图中的模糊完全对应仍需实测。

## 具体 CSS 修复

- body 增加 `padding-top:env(safe-area-inset-top,0px)`。顶部空隙在正常文档流内，不增加 overlay，不减掉原有品牌顶部间距。桌面 env 为0时原几何保持。
- 将 nav 样式限定到 `.bottom-nav`，HTML 仅给现有 nav 增加该 class；JS 的 nav 查询不变。
- 删除原 nav 的 `backdrop-filter:blur(12px)`，背景改为 #fff，移除唯一潜在固定滤镜合成干扰源。**底部 blur 不保留**；nav 的位置、尺寸、按钮、边框和底部安全区不变。这是排除合成因素的防护性修改，不是已证明 WebKit compositor 故障的结论。
- 没有新增 overflow:hidden 或提高 z-index。原有防横滚和 modal 内部滚动结构未动。

## Empty State

真实 DOM：`div.panel.empty > h3 + p.muted`。原 CSS 已 text-align:center，子元素为正常流 block，无图标占位、text-indent、translateX、绝对定位或非对称横向 padding。

修复前两引擎、五种手机宽度的标题和说明 DOM 中心偏差都为0px。因此没有证据将实机光学偏移归咎于左 padding 或额外空列。

现将 .empty 明确设为 column flex、align-items:center、justify-content:center、width:100%；直接子元素 margin-inline:auto；标题和说明 width:100%、text-align:center、text-indent:0、letter-spacing:normal。保留原垂直 margin、字体、卡片 padding/border/radius。卡片前后尺寸、padding和圆角通过基线比较，未重新设计。

## 验证

`tests/v022.cjs`：Chromium/WebKit；320×568、375×667、390×844、393×852、430×932；训练、状态、历史、诊断、导入编辑/预览在顶部和滚动后均扫描。可见 fixed/sticky 只允许 bottom-nav、toast、dialog；检查元素和生效伪元素滤镜；当前无任何应用 filter/backdrop-filter。模态弹窗允许占据顶部，但没有滤镜，不作为意外 overlay。

| Viewport | Chromium / WebKit overflow | 顶部应用 blur layer | 标题中心偏差 | 说明中心偏差 |
|---|---|---|---|---|
| 320×568 | 0 / 0 | 0 / 0 | 0px / 0px | 0px / 0px |
| 375×667 | 0 / 0 | 0 / 0 | 0px / 0px | 0px / 0px |
| 390×844 | 0 / 0 | 0 / 0 | 0px / 0px | 0px / 0px |
| 393×852 | 0 / 0 | 0 / 0 | 0px / 0px | 0px / 0px |
| 430×932 | 0 / 0 | 0 / 0 | 0px / 0px | 0px / 0px |

- 无横滚测试临时关闭 html/body 的裁切，未豁免任何可见溢出元素。
- nav bottom 等于视口底；各页末尾按钮可滚到 nav 上方至少8px。
- 59px 顶部/34px 底部安全区通过测试时替换 CSS env 值、在应用启动前生效来模拟；Logo 顶部相应下移59px，文档流和导航间距通过。初次测试在启动后改变 padding 导致导航已测高度未同步；改为按真实初始加载顺序模拟后通过，没有修改生产JS。
- 390×320模拟键盘空间，导入取消按钮可见、解析按钮可滚到；1280×844桌面空卡尺寸基线通过。
- 修复前卡片几何基线保存在 tests/fixtures/v021-empty-geometry.json，修复前数据代码哈希在 v021-data-hashes.json。
- 诊断 fixture（合成数据，并非用户历史）：Strength3、Cardio0、A/B/C/D=0/1/2/0、legacy sleep2、Daily Status2，范围9/5～9/6。统计保持，完整storage字符串相同。
- Chromium/WebKit 无 pageerror。390px WebKit 空状态/诊断截图人工查看通过。
- PWA 测试期待值升级为v9，Chromium实际缓存及离线载入示例通过。

## 实机边界

**顶部 blur 的真实 iPhone 视觉效果仍需实机确认。** 请在原主屏幕 PWA 入口联网更新后，检查首次打开/小幅滚动时顶部状态栏区域、各页 eyebrow/title、空状态文字视觉中心，以及真实键盘/安全区。自动化只能证明应用 DOM/CSS 没有滤镜层与几何偏移，无法测量 iOS 系统绘制层，也不能排除旧缓存或系统合成因素。不要求卸载、重新安装或清除网站数据。
