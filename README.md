# Codex Bilibili Player

在聊天与分栏布局里看 B站视频。聊天内卡片和右侧播放器共用一个播放会话，可以切换位置、缩放卡片、搜索视频和找回观看进度。

项目使用 **Electron + React + TypeScript**，提供 **Windows x64 便携版**。账号、搜索、播放、历史和 UP 主页接入 B站服务；聊天与开发工作区是本地演示场景，没有接入 AI 模型。

[下载 Release](https://github.com/78percent/Codex_Bilibili_Player/releases) · [兼容与常见问题](docs/compatibility.md) · [本地数据](docs/privacy.md) · [贡献指南](CONTRIBUTING.md)

## 直接使用

从 Release 下载版本对应的 `*-x64.exe` 和 `SHA256SUMS.txt`。下载的是 EXE 附件，不是 `Source code`；无需安装 Node.js、Git 或 WebView2，首次启动会先解压运行文件。

- 左侧小电视打开视频搜索，时钟打开观看记录。
- 左下角头像登录 B站：应用内扫码，或在 B站官方窗口使用密码、短信登录。
- 播放和账号写操作需要登录并通过手机号绑定状态检查。
- EXE 未签名，Windows 可能提示 SmartScreen。核对来源与哈希；不要为了启动程序关闭安全软件。
- 便携版仍在 AppData 保存数据，删除 EXE 不会清除账号以外的历史、搜索和聊天记录。

## 功能

- **播放器**：进度、播放音量、清晰度、倍速、字幕与弹幕；聊天卡片和右侧窗口共用会话。
- **分 P 与快捷键**：选集切换；播放器范围内左右短按跳转 5 秒，上下短按或长按调整播放音量。
- **搜索**：热搜、联想、最近搜索；综合、最多播放、最新发布、最多弹幕、最多收藏排序；时长与分区筛选。
- **相关 UP**：仅在综合排序、无筛选的第一页显示 B站实际返回的最多两位；没有返回则不显示。
- **UP 主页**：浮层内浏览资料、投稿、动态、合集、关注与粉丝；支持真实关注和动态点赞，按需分页。
- **浏览与记录**：前进/后退恢复条件与位置；观看历史有快捷卡片和管理窗口，支持恢复播放。

分 P、扩展搜索和 UP 浏览属于 1.4.0 源码范围；旧版 v1.3.3 下载不包含这些新增功能。发布是否完成及验证范围，以 Release 页面和[版本记录](docs/releases/1.4.0.md)为准。

## 从源码运行

准备 Windows x64、Node.js 24 LTS 和 Git，在 PowerShell 中执行：

```powershell
git clone https://github.com/78percent/Codex_Bilibili_Player.git
cd Codex_Bilibili_Player
npm ci
node node_modules/electron/install.js
.\Start-Development.cmd
```

只调整网页布局可用 `npm run dev`；B站功能需要完整 Electron 启动入口。开发版使用独立的用户数据目录，详见[架构说明](docs/architecture.md)。

```powershell
npm test
npm run typecheck
npm run build
# 打包 Windows x64 便携版，输出到 release/
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npm run package
```

## 许可与项目边界

自有代码采用 [MIT](LICENSE)，允许商用、修改和再分发，须保留许可与版权声明。字体、依赖和服务标识保留各自许可，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和[资源来源](docs/sources.md)。

这是个人开发的非官方项目，与 OpenAI、Codex 或 Bilibili 没有官方关联。B站接口与风控可能变化，会员、地区、付费和内容权利限制继续生效；本项目不提供绕过能力。

开发流水账、原始研究输出、个人截图和会话路径保留在维护者本地，不纳入新版公开源码。旧提交和旧 Release 保留原貌；本次整理不等于从历史、他人克隆或缓存中抹除旧文件。
