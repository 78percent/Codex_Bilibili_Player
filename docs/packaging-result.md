# 打包结果

2026-11-12 完成 Windows x64 便携 EXE 交付。

- 文件：`release/Codex-Bilibili-Player-1.0.0-x64.exe`
- 大小：85,908,581 字节（约 81.93 MiB）。
- SHA-256：`1CFCF92C7473C8982AB6D18849974B42D839B503C51DEC09B7E74DAFB34BF8C9`
- Electron：36.9.5；electron-builder：26.18.0。
- 生产前端编译成功；便携打包命令退出码为 0。
- 程序资源保留图标、名称和版本信息；未代码签名。

前端产物来自已完成的 Vite 生产编译。后续仅运行 `electron-builder --win portable --x64`，复用该编译结果和 `.runtime/electron`。Node 下载打包依赖出现 ECONNRESET 后，通过 PowerShell 下载上游原始归档到 `.cache/electron-builder`，由构建器按内置校验值读取、解压。

便携 EXE 已复制到本会话 `outputs` 目录，附 `使用说明.md` 和同步后的设计记录。源码根目录为 `D:\Codex_Bilibili_Player`。

按用户要求未运行测试、lint、类型检查、自动截图比较或启动验证。这里记录的是编译、打包与文件交付结果；运行行为及视觉 1:1 尚未验收。视频模块继续留空。

## 1.1.0 · 截图布局修订交付

2026-11-12：npm run package 完成 Vite 生产编译及 portable x64 打包，退出码 0。

- 制品：release/Codex-Bilibili-Player-1.1.0-x64.exe。
- 大小：85,917,126 字节（约 81.94 MiB）。
- 项目根目录运行入口：D:\Codex_Bilibili_Player\Codex-Bilibili-Player.exe。
- 桌面快捷方式：`%USERPROFILE%\Desktop\Codex Bilibili Player.lnk`。
- 快捷方式目标为上面的根目录 EXE，工作目录为项目根目录，图标取自 assets/app.ico。
- 会话 outputs 目录同步保留 1.1.0 便携 EXE、使用说明和设计记录。

本次打包使用已缓存 Electron 36.9.5 与打包工具。未运行测试、lint、类型检查、截图比较或启动验证；未执行 EXE。

## 1.2.0 · 模型浮层与过程结构交付

2026-11-12：npm run package 完成Vite生产编译及portable x64打包，退出码0。源字体Open Sans Regular已内置。

- 制品：release/Codex-Bilibili-Player-1.2.0-x64.exe。
- 项目根目录新版入口：D:\Codex_Bilibili_Player\Codex-Bilibili-Player-1.2.0-x64.exe。
- 桌面快捷方式“Codex Bilibili Player”已更新到该版本化入口。
- 原Codex-Bilibili-Player.exe被运行中的旧版占用，覆盖失败；保留原文件和旧进程，未终止应用。
- 使用新版前需退出旧版播放器。新旧版本使用同一单实例锁，旧版运行期间不会同时启动新版。
- outputs目录同步制品、使用说明和设计记录。

未运行测试、lint、类型检查、截图比较或启动验证。打包结果不能代替视觉与交互验收。


## 1.2.1 · Inter与思源黑体

生产编译及portable打包完成，命令退出码0。制品大小为 104508362 字节。根目录入口为 D:\Codex_Bilibili_Player\Codex-Bilibili-Player-1.2.1-x64.exe，桌面快捷方式已指向该文件。Inter和思源黑体及许可证随包内置。未运行测试或启动验证，未终止旧版进程。


## 1.2.2 · JetBrains Mono代码字体

2026-11-12：生产编译及Windows x64 portable打包完成，命令退出码0。制品大小为 104706921 字节。根目录入口为 D:\Codex_Bilibili_Player\Codex-Bilibili-Player-1.2.2-x64.exe，桌面快捷方式已更新。JetBrains Mono正体、斜体及OFL许可证已随包内置。outputs同步制品及文档。未运行测试、lint、类型检查或启动验证，未终止旧版应用。

