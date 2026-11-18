# Codex Bilibili Player

在 Codex 风格的桌面工作区里看 B 站视频。

基于 **Electron + React + TypeScript** 的 Windows 桌面项目，保留聊天、文件预览和分栏布局，将 Bilibili 账号与视频播放接入其中。视频既可以嵌在聊天记录里，也可以移到右侧窗口。

这是独立开发的非官方项目，与 OpenAI、Codex 或哔哩哔哩无隶属关系。

## 下载与使用

当前版本 **1.3.3 预发布版 · Windows x64**。

1. 打开 [GitHub Release](https://github.com/78percent/Codex_Bilibili_Player/releases/tag/v1.3.3)，下载 **Codex-Bilibili-Player-1.3.3-x64.exe**。`Source code` 是源码，不是可直接运行的程序。
2. 双击 EXE。便携版已包含运行环境，不需要安装 Node.js、npm、Git，也不需要下载本仓库。首次启动会解压运行文件，稍候即可。
3. 点击左侧粉色小电视搜索视频；游客可以浏览热搜、联想和搜索结果。播放前点击左下角头像登录 B 站，并完成手机号绑定校验。
4. 左侧时钟打开观看记录；头像菜单里的“观看历史”打开快捷卡片。选中记录后在当前对话中播放。

程序目前未签名，Windows 可能显示 SmartScreen 提示。请确认文件来自上述仓库；Release 同时提供 `SHA256SUMS.txt`，可在 PowerShell 中用 `Get-FileHash .\Codex-Bilibili-Player-1.3.3-x64.exe -Algorithm SHA256` 核对。

## 当前功能

| 功能 | 说明 |
| --- | --- |
| 三种登录入口 | 应用内扫码；账号密码、手机验证码在隔离的 B 站官方登录窗口完成 |
| 手机号绑定校验 | 登录后检查 B 站账号是否已绑定手机号，符合条件后使用视频功能 |
| 本机记住登录 | 使用 Electron safeStorage 加密保存会话，提供退出登录入口 |
| Profile | 展示头像、昵称、UID、会员与手机号绑定状态 |
| 首页推荐取片 | 获取登录账号首页的首个普通视频，跳过广告与直播 |
| 聊天内视频卡片 | 卡片可拖动调整尺寸，沿用聊天记录布局 |
| 右侧视频窗口 | 与聊天卡片共用一个播放器，在两个位置之间切换 |
| 播放控制 | 单排工具栏、推荐队列上/下一条、画面点击暂停、进度、音量、实际可用清晰度及五档倍速 |
| 字幕与弹幕 | 视频提供的字幕轨道和样式；实时池文字弹幕、显示参数、类型与屏蔽词设置 |
| 视频搜索 | 真实 B 站热搜、联想与视频结果；联想按窗口高度请求，输入时保持面板高度，近期请求缓存复用 |
| 观看记录 | 头像快捷卡片与时钟管理窗口；账号历史搜索、日期/进度筛选、“本软件看过”标记及进度同步 |
| 续播与界面恢复 | 按账号保存上次视频和进度，重开后暂停等待播放；保留视频卡片尺寸与分栏宽度 |
| 桌面工作区 | 可折叠侧栏、可拖动分栏、文件与差异预览和本地演示场景；侧栏齿轮仅保留占位 |

真实 B站视频的画面与声音、清晰度切换、双位置连续播放、缩放和布局在此前版本已有确认。**1.3.3 的验证范围与限制**见 [发布记录](docs/releases/1.3.3.md)。

播放器控件接入过程见 [控件接入记录](openspec/changes/explore-player-controls/implementation.md)。字幕选择固定向下展开；选集入口暂时隐藏，不提供全屏。

观看历史已接入列表、搜索与播放进度上报，B站视频搜索也已接入。收藏夹和关注列表目前只保留入口。聊天回复、终端、Git/PR、自动化和工具调用使用本地预设场景，没有接入 AI 模型或真实开发服务。

## 从源码启动

环境：**Windows x64、Node.js 24 LTS、npm、Git**。安装依赖需要联网，登录及播放需要访问 B 站服务。

在 PowerShell 中执行：

```powershell
git clone https://github.com/78percent/Codex_Bilibili_Player.git
cd Codex_Bilibili_Player
npm ci

.\Start-Development.cmd
```

首次 `npm ci` 会下载 Electron 45.3.3；不要使用 `--ignore-scripts`，否则不会安装所需运行时。开发与打包统一使用 `node_modules/electron/dist`，不再需要手工复制旧运行时。

启动脚本复用上次使用的本机端口（首次使用 5173）启动 Vite，再打开 Electron 开发窗口，让本地观看记录与布局跨重启保留。再次启动会唤回已有窗口；窗口已退出但本项目 Vite 仍在运行时，会核对进程记录后清理残留。其他程序占用该端口时会报告错误。关闭窗口后，脚本结束自己启动的 Vite 进程。`npm run dev` 只启动网页前端，完整账号与播放功能需要 Electron。

### 开始播放

1. 点击左下角齿轮下方的账号入口，选择扫码、密码或短信登录。
2. 完成 B 站登录及手机号绑定状态检查。
3. 搜索并选择视频，或在视频对话中播放首页推荐；使用卡片按钮切换到右侧窗口。
4. 点击播放器上的齿轮打开音量、清晰度、五档倍速、字幕和弹幕设置；拖动聊天卡片右下角调整尺寸。

喇叭按钮单击静音或恢复，悬停展开音量滑杆。点击画面暂停或继续，画面区域滚轮调整音量。画面获得焦点后，Space/Enter 控制播放，左右键跳转 5 秒，上下键调整音量，M 静音，D 切换弹幕。字幕来自视频实际轨道；弹幕来自实时池，不包含全部历史评论。

重新打开时回到视频所属聊天，右侧预览默认收起；保留分栏宽度、放大状态及聊天卡片宽度。登录恢复后读取该账号上次视频与进度，保持暂停，点击播放后续播；侧栏播放图标可随时返回视频对话。首次记录从包含此功能的源码运行后开始保存。

播放使用 H.264/AAC 的 SDR 音视频流；不绕过会员、地区或内容访问限制。首条推荐无法播放时会显示原因，不会悄悄换成后续视频。

## 本地数据

| 用途 | 位置 |
| --- | --- |
| 开发窗口账号与界面数据 | `%APPDATA%\CodexBilibiliPlayer-Dev` |
| 打包版本账号与界面数据 | `%APPDATA%\CodexBilibiliPlayer` |
| 开发启动日志 | `.runtime/integration/` |

开发版和打包版的登录状态相互独立，也不读写原版 Codex 的账号。B 站会话保存在本机加密文件 `bilibili-session.bin` 中；密码和短信验证码由 B 站官方页面处理。媒体请求经本机回环服务转发，不向视频 CDN 转发账号 Cookie。

启动时恢复加密会话并联网确认账号。成功确认后，同一会话的自动登录检查复用 60 秒内的结果，并合并并发检查；手动刷新仍联网检查，退出登录或接口返回登录过期时清除缓存。

观看历史、搜索词和聊天内容保存在本机明文 localStorage 中。历史与搜索按 B站 UID 区分，聊天和工作区设置由同一 Windows 用户共用；退出 B站账号不会清除这些记录。实际播放会向 B站同步观看进度。便携程序删除后，AppData 中的数据仍保留。

依赖、运行时、日志、缓存、会话文件和构建产物不提交到仓库。

## 构建与打包

完成上面的依赖与运行时准备后：

```powershell
# 仅构建前端，输出到 dist/
npm run build

# 构建前端并生成 Windows x64 便携程序，输出到 release/
$env:ELECTRON_BUILDER_CACHE = "$PWD\.cache\electron-builder"
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npm run package
```

打包配置使用 `node_modules/electron/dist`，便携程序不需要用户另装 Node.js。当前未配置代码签名。

打包输出 `release/Codex-Bilibili-Player-1.3.3-x64.exe`，对外分发使用这个单文件包。本地开发也可运行 `release/win-unpacked/Codex Bilibili Player.exe`，但必须保留整个 `win-unpacked` 文件夹。界面加载与本机 B站服务初始化并行，播放地址请求与 dash.js 加载并行。

当前产物面向 Windows x64。未签名 EXE 可能触发 SmartScreen 或安全软件拦截；B站接口、风控和网络环境也会影响登录及播放。运行时安全维护、资源授权与本轮源码修复情况见 [分发审查报告](docs/reviews/2026-11-16-exe-distribution.md)。报告只基于静态审查，不代表跨电脑运行验收或安全认证。

观看历史默认 440 × 780px，观看记录默认 530 × 880px，空记录和加载中保持展开高度，受屏幕可用空间限制。搜索框左侧小电视保持 21px，循环眨眼与轻微转动视线；请求期间变粉色，减少动态效果设置下停止动画。联想最多请求 20 条，实际返回数量由 B 站接口决定。

本次发布经用户明确授权运行测试、类型检查和最终 EXE 启动验证。验证记录见 [1.3.3 发布记录](docs/releases/1.3.3.md)，旧版记录见 [1.3.0](docs/releases/1.3.0.md)。EXE 作为 Release 附件上传，不进入 Git 源码历史。

## 项目结构

```text
electron/
  bilibili/             # 账号、社区 API、推荐及媒体中转
  main.cjs              # 桌面窗口与应用生命周期
  window.cjs            # 窗口创建、权限与窗口控制 IPC
  preload.cjs           # 渲染层与主进程之间的专用接口
src/
  app/                  # 工作区外壳、标题栏与活动栏
  components/ui/        # 公共控件
  features/account/     # 登录、头像菜单与 Profile
  features/video/       # 播放会话、聊天卡片与右侧窗口
  features/history/     # 观看记录与快捷卡片
  features/video-search/ # 视频搜索与联想
  features/             # 聊天、文件等功能模块
  scenarios/            # 本地虚构开发场景
  state/                # 状态管理
    persistence.ts      # 本地状态恢复与保存
  styles/               # 样式与字体
public/                 # 静态资源、实际使用的字体及许可证
openspec/               # 需求、方案与开发进度
docs/                   # 设计、研究来源与历史实施记录
```

## 接口与资源来源

B 站接入采用主站社区接口，集中封装在 `electron/bilibili/`。社区接口会随主站调整，不能保证长期不需要维护。

- [Bilibili 开放平台](https://openhome.bilibili.com/doc)
- [bilibili-api-collect](https://github.com/bilibili-plugins/bilibili-api-collect)：社区接口参考资料
- [dash.js](https://github.com/Dash-Industry-Forum/dash.js)：DASH 音视频播放
- [设计与资源来源](docs/sources.md)
- [B 站接入设计](openspec/changes/connect-bilibili-playback/design.md)
- [实施与问题修复记录](openspec/changes/connect-bilibili-playback/implementation.md)

界面参考 Codex 桌面版的静态研究资料。部分图标沿用研究样本，其来源与权利归属记录在资源文档中；本项目没有将这些资源声明为自行创作或重新授权。Inter、思源黑体、JetBrains Mono 的许可证随 `public/fonts/` 保留。项目尚未为自有代码选定开源许可证，第三方组件与资源遵循各自许可证。
