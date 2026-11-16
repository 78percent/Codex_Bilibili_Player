# 截图布局修订计划
沿用已批准的模块化 React/Electron 方案，按用户新截图调整。使用 writing-plans 记录实施，直接继续现有授权范围。

## 设计
浅灰窗口菜单栏、独立 50px 图标栏、276px 可调整侧栏。聊天与变更区分别拥有标题栏；侧栏采用项目折叠项和最近会话。Segoe UI / Microsoft YaHei UI；代码 Consolas；沿用 REA 的动画参数。
聊天新增可折叠过程摘要、网页来源、图片记录和文件修改卡片，提供三组虚构示例。右侧变更区下方加入空视频渲染窗口，可收起或放大；不接播放源。

## 实施
- [x] 拆分 DesktopBar、ActivityRail，调整 Sidebar 和聊天标题。
- [x] 实现 ActivityBlock、ChangeSummary、示例数据及已有状态迁移。
- [x] 调整差异排版与代码着色，加入 VideoDock。
- [x] 生产编译打包 1.1.0；复制到 D 盘根目录，创建桌面快捷方式。
- [x] 同步 OpenSpec 和实施日志。

不运行测试、lint、类型检查、截图比较或启动验证。保留旧会话状态，仅一次性加入新示例并切换新布局。


