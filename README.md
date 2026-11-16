# Codex Bilibili Player

在 Codex 风格的桌面工作区里看 B 站视频。

基于 **Electron + React + TypeScript** 的 Windows 桌面项目，保留聊天、文件预览和分栏布局，将 Bilibili 账号与视频播放接入其中。视频既可以嵌在聊天记录里，也可以移到右侧窗口。

这是独立开发的非官方项目，与 OpenAI、Codex 或哔哩哔哩无隶属关系。

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
| 播放控制 | 播放、暂停、进度、音量和账号实际可用的清晰度选择 |
| 桌面工作区 | 可折叠侧栏、可拖动分栏、文件与差异预览、设置和本地演示场景 |

**当前进度：** 已接通真实 B 站视频，用户已确认画面与声音正常。清晰度切换、双位置连续播放、缩放和全部布局尚未完整确认，详细记录见 [OpenSpec 进度](openspec/changes/connect-bilibili-playback/tasks.md)。

收藏夹、观看历史和关注列表目前只保留入口。聊天回复、终端、Git/PR、自动化和工具调用使用本地预设场景，没有接入 AI 模型或真实开发服务。

## 从源码启动

环境：**Windows x64、Node.js 22 LTS、npm、Git**。安装依赖需要联网，登录及播放需要访问 B 站服务。

在 PowerShell 中执行：

```powershell
git clone https://github.com/78percent/Codex_Bilibili_Player.git
cd Codex_Bilibili_Player
npm ci

# 启动脚本与打包配置使用项目内的 Electron 运行时。
# npm ci 安装 Electron 后，将其运行时复制到约定目录。
New-Item -ItemType Directory -Force .runtime/electron | Out-Null
Copy-Item -Path node_modules/electron/dist/* -Destination .runtime/electron -Recurse -Force

.\Start-Development.cmd
```

首次 `npm ci` 会下载 Electron 36.9.5；不要使用 `--ignore-scripts`，否则不会安装所需运行时。

启动脚本会在本机随机端口启动 Vite，再打开 Electron 开发窗口。关闭该窗口后，它会结束自己启动的 Vite 进程。`npm run dev` 只启动网页前端，完整账号与播放功能需要 Electron。

### 开始播放

1. 点击左下角齿轮下方的账号入口，选择扫码、密码或短信登录。
2. 完成 B 站登录及手机号绑定状态检查。
3. 在演示聊天中播放首页首个普通视频，使用卡片按钮切换到右侧窗口。
4. 使用清晰度菜单选择当前账号可用的画质；拖动聊天卡片右下角调整尺寸。

播放使用 H.264/AAC 的 SDR 音视频流；不绕过会员、地区或内容访问限制。首条推荐无法播放时会显示原因，不会悄悄换成后续视频。

## 本地数据

| 用途 | 位置 |
| --- | --- |
| 开发窗口账号与界面数据 | `%APPDATA%\CodexBilibiliPlayer-Dev` |
| 打包版本账号与界面数据 | `%APPDATA%\CodexBilibiliPlayer` |
| 开发启动日志 | `.runtime/integration/` |

开发版和打包版的登录状态相互独立，也不读写原版 Codex 的账号。B 站会话保存在本机加密文件 `bilibili-session.bin` 中；密码和短信验证码由 B 站官方页面处理。媒体请求经本机回环服务转发，不向视频 CDN 转发账号 Cookie。

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

打包配置使用 `.runtime/electron`，便携程序不需要用户另装 Node.js。当前未配置代码签名。

仓库提交的是当前源码，不包含本机旧 EXE。`package.json` 暂沿用 `1.2.2` 版本号，之前的 1.2.2 界面演示包不包含本轮 B 站接入；版本号不能用于判断该旧包是否具备播放功能。

本次上传没有运行测试、lint、类型检查、启动验证或重新打包。

## 项目结构

```text
electron/
  bilibili/             # 账号、社区 API、推荐及媒体中转
  main.cjs              # 桌面窗口与应用生命周期
  preload.cjs           # 渲染层与主进程之间的专用接口
src/
  app/                  # 工作区外壳、标题栏与活动栏
  components/ui/        # 公共控件
  features/account/     # 登录、头像菜单与 Profile
  features/video/       # 播放会话、聊天卡片与右侧窗口
  features/             # 聊天、文件、设置等功能模块
  scenarios/            # 本地虚构开发场景
  state/                # 状态管理
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
