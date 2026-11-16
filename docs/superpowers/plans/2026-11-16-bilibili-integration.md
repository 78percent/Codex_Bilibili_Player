# Bilibili Integration Implementation Plan

> 执行：executing-plans，当前会话连续实施，最后独立 code reviewer。用户已明确开始开发，不再重复请求计划授权。

**Goal:** 三种登录入口、真实 Profile、首页首条普通视频，在聊天卡片与右侧窗口共用播放会话。

**Architecture:** Electron 主进程管理独立内存 session 与 safeStorage 凭证文件、B站接口、只绑定本机的媒体网关。React 按账号与播放器模块组织；一个真实 video DOM 在两处宿主间移动，避免双音轨与重新加载。

**Tech Stack:** Electron 36、React 19、dash.js、qrcode。

**Spec:** openspec/changes/connect-bilibili-playback/design.md；2026-11-16 用户最新要求优先。

## Constraints / rulings

- 仅布局和视频功能运行验收；不写/跑单元测试、lint、类型检查或额外验证。
- 当前目录不是 Git 仓库；在指定目录实施，不初始化 Git 或创建伪 worktree。保留现有发行包。
- 密码/短信在官方 passport 登录页完成，选择对应页签，共用应用独立会话；本应用不采集密码和短信内容。已只读确认官方页面有密码与短信页签。
- 保留两处播放器，聊天卡片可拖动缩放；默认聊天内显示，通过显式按钮切换到右侧。
- 网络失败不清除凭证，明确过期才要求重新登录。未确认绑定不得请求播放。

## Review focus

- 切换宿主、隐藏页面、退出账号时只有一个音视频会话，旧异步请求不得恢复退出前的数据。
- QR 取消与官方登录完成的生命周期，过期和网络错误的区别。
- 实际授权和支持编码决定画质，不显示虚假的可播放档位。
- MPD 初始化/索引与 Range/跨域处理、媒体中转不得转发账号凭证。
- 头像菜单/Profile/卡片在最小窗口和深色主题下的溢出。

## Tasks

- [x] 1. electron/bilibili/{client,account,media,index}.cjs：请求签名、持久会话、官方登录窗口、媒体网关；preload 专用 IPC 返回 {ok,data}|{ok:false,error}。
- [x] 2. src/features/account/：类型、Provider、登录面板、头像菜单、Profile；接入 ActivityRail/App/main。
- [x] 3. src/features/video/：共享视频会话 Provider、真实 video 节点与 dash.js、双宿主控件、聊天卡片缩放；接入 Conversation 与 VideoDock。
- [ ] 4. 样式与已批准约束文档同步，启动仅用于布局/视频验收的 Electron 开发窗口。
- [ ] 5. 用户登录前继续静态审查与布局验收；用户登录后真实视频功能验收。遇到账号输入/验证码交给用户。
- [ ] 6. 独立代码审阅，修复实质问题，记录已验证/未验证项目。

## Progress

- 计划已建立，开始任务 1；未启动测试，未操作用户账号。

- 独立静态审查完成，修复隐藏宿主自动播放、退出 Cookie 竞态、二维码版本竞态；无运行验证。
- 任务4/5：启动被自动审批策略拒绝；用户明确授权重试仍被拒绝，已交付手动启动脚本并等待结果。
