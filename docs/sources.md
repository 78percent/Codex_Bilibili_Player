# 资源与研究来源

## Codex Windows

- 本机 Windows 包：OpenAI.Codex_26.1103.7773.0_x64__2p2nqsd0c76g0。
- app.asar 内应用版本：26.1103.60933。
- app.asar SHA-256：ee88fdd77fb7346efb5e91ce73c7c0eee4eba390ffba3192635d5cdbe44e4097。
- REA 父证据：ev_694286f7d3b6116c275803e05e219c1b02c160a62a15a067bcbcf87148f4d4dc。
- 样式依据：webview/assets/async/e77f816560c6.css。采用 4px spacing、14px base、系统字体、150/200/300ms 动画与原版曲线；其他布局参数为模块化重建值。
- 设置注册来源：webview/assets/async/499225.6d2e47bea2.js 的 n74t 模块。包内共享功能注册不等于当前账号可见性。
- public/blossom.svg 来自 webview/assets/openai-blossom-31ad67e73c52.svg。
- assets/app.ico 来自原安装包 resources/chatgpt-app-dark.ico。

原版资源保留其原有权利归属，仅用于用户请求的本地界面研究。没有把原版应用的专有后端或账号能力移植到本项目。没有把桌面资源的许可推定为 openai/codex CLI 仓库的 Apache-2.0。

## 参考仓库

- https://github.com/openai/codex ：公开 CLI 项目，与桌面 GUI 分开。
- https://github.com/BrokenHT/Cotex_DeskReader ：借鉴 Electron 外壳与内容替换思路，未复制其业务实现或视觉主题。

## 新项目依赖

React (MIT)、Electron (MIT)、Vite (MIT)、TypeScript (Apache-2.0)、Lucide (ISC)、electron-builder (MIT)。依赖许可证保留在安装依赖和运行时中。Electron 的 Chromium 许可随打包运行时保留。

## 1.1.0 截图补充依据

用户在本会话提供 codex-clipboard-eeffaf89-31bf-478b-b27f-0b043f13e3c9.png，作为四区域布局和字体层级参照。产品资源 workspace-reference.svg 为自行绘制的示意图；活动记录、网页来源列表和过程摘要是本地演示数据，没有进行真实联网检索。

## 1.2.0 字体和补充截图

布局依据本轮六张用户截图。字体源为用户放入项目的fonts/Open-Sans/Open-Sans/Open-Sans-2.ttf，读取name表为Open Sans Regular。源文件未改名，随应用发布的副本为public/fonts/open-sans.ttf。英文/数字由Open Sans绘制，缺失中文字符由Microsoft YaHei UI/系统字体回退。

## 1.2.1字体来源

- Inter 4.1：用户项目fonts/Inter-4.1/web/InterVariable.woff2及InterVariable-Italic.woff2，LICENSE.txt随public/fonts资源打包。
- Source Han Sans CN：Adobe官方2.005R，https://github.com/adobe-fonts/source-han-sans/releases/download/2.005R/19_SourceHanSansCN.zip 。使用Regular/Medium/Bold OTF，LICENSE.txt随包发布。
- 文本栈为Inter、Source Han Sans CN、sans-serif。Inter中没有的汉字与中文标点使用思源黑体；代码区也遵从用户这次的字体分配。

## 1.2.2代码字体来源

JetBrains Mono 2.304来自用户目录fonts/JetBrainsMono-2.304，使用fonts/variable下正体与斜体可变TTF，字重100–800。发布副本为public/fonts/jetbrains-mono-variable.ttf及jetbrains-mono-variable-italic.ttf，原OFL.txt复制为JetBrainsMono-OFL.txt随应用分发。代码字体分配取代1.2.1代码区沿用Inter的决定；普通界面字体不变。
