# 播放器控件实施计划

> 执行方式：executing-plans，在当前目录逐项实施；最后独立静态审查。用户已确认原型并要求开工，不再次设置批准关卡。

**目标：** 将已批准的 A 方案接入真实播放器，字幕选项固定向下展开。
**架构：** 保留单 video/dash.js 会话。VideoProvider 管理队列与播放偏好，独立 hook 读取字幕/弹幕；工具栏、浮层与覆盖层按功能拆分。账号/媒体/搜索现有改动均保留。
**技术：** React 19、TypeScript、Electron、dash.js、Lucide；不增加依赖。
**依据：** openspec/changes/explore-player-controls/proposal.md 和 docs/prototypes/player-controls.html，用户最新明确开始实施。

## 约束与裁定

- 不运行测试、lint、类型检查、启动验证、构建或打包；用户禁测覆盖技能默认 TDD 流程。只进行源码阅读和独立静态审查。
- 原目录存在其他任务的未提交搜索和聊天改动。本轮原地增量编辑，不切分或移动这些改动，不提交/推送。
- 上一条返回本次队列中的已看视频，下一条沿当前首页推荐批次推进，批次用完再请求新批次；不静默跳过无法播放的视频。搜索选片成为新队列的起点。
- 观看偏好在本应用的本地存储中保留；会话历史只存内存，退出账号时清空。
- 弹幕采用社区 XML 实时池接口，不声称获取全部历史弹幕。只渲染普通/顶部/底部文字，不执行高级代码弹幕。
- 选集入口保持隐藏；无全屏功能。保留现有聊天卡片、右侧宿主及搜索选片接口。

## 审查重点

1. 换片、退出、迟到的接口响应不能覆盖当前播放或字幕/弹幕。
2. 两个宿主共用播放时间、音量、倍速和覆盖内容，不重复发声。
3. 静音恢复非零音量，输入框和滑杆不被播放器快捷键接管。
4. 下拉选项在控件下方展开；面板空间不足时滚动而不翻成上拉。
5. 字幕/弹幕缺失或失败只影响对应功能；网络请求与外部字幕 URL 不泄露 Cookie。

## 任务

- [x] 1. 主进程扩展推荐队列、字幕元数据/正文与弹幕读取。文件：electron/bilibili/index.cjs、captions.cjs。IPC：nextVideo、previousVideo、subtitles、subtitle、danmaku；携带 bvid/cid 核对当前选择。
- [x] 2. 共享状态与真实覆盖层。文件：VideoProvider.tsx、preferences.ts、useVideoExtras.ts、VideoOverlays.tsx。五档倍速、静音恢复、偏好持久化、字幕按时间显示、弹幕按媒体时钟移动及过滤。
- [x] 3. 接入单排工具栏和设置。文件：VideoSurface.tsx、VideoControls.tsx、PlayerSettings.tsx、PlayerSelect.tsx、player-controls.css。点击画面、滚轮、快捷键、音量悬停浮层、自定义向下列表和过渡；不受容器裁切。
- [x] 4. 独立代码审查、按事实修正问题、更新 OpenSpec 任务与实施记录。静态审查不能标成运行通过。

## 接口一致性

任务 1 → 2：VideoInfo 包含 canPrevious/canNext；字幕列表使用 id/language/label，正文使用 from/to/content；弹幕传 XML 字符串，由 DOMParser 惰性文本解析。
任务 2 → 3：所有播放方法与偏好通过 useVideo() 提供，覆盖层只读取当前媒体时钟，控件不创建 video。
