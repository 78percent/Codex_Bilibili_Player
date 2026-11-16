# 设计
- 窗口顶端为菜单和窗口按钮；下方是 50px 功能栏与圆角主表面。
- 276px 侧边栏显示项目、置顶和最近会话；原功能移到细栏或菜单中。
- 聊天标题与右侧标签栏等高，正文、输入框和变更面板独立滚动。
- Segoe UI / Microsoft YaHei UI 用于界面，Consolas 用于差异代码。使用 REA 来源的动画参数。
- ActivityBlock 展示预设思考摘要、网页来源、图片缩略图；ChangeSummary 连接右侧文件选择。
- VideoDock 位于工作区底部，支持收起、展开和放大。只有空 video 元素，没有视频源、Bilibili 接口或视频信息。
- 三组虚构演示会话加入原持久化数据，不删除旧会话。
- 示例缩略图为新绘制的示意 SVG，不把用户截图中的个人会话复制进产品资源。

实施计划：docs/superpowers/plans/2026-11-12-screenshot-layout.md。
禁止测试、lint、类型检查、启动和自动视觉验证；仅生产编译及打包。

