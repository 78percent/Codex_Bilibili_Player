# 资源来源

## 项目自身素材

- `assets/app.svg` 与 `assets/app.ico`：为本项目绘制的几何播放器图标，按项目 MIT 许可分发。
- `public/workspace-reference.svg`：项目绘制的工作区布局示意，用于本地演示场景。
- 界面采用聊天与分栏工作区布局。独立实现不包含原版桌面软件的专有后端。
- 1.4.0 已替换来自第三方安装包的应用图标，移除未使用的第三方标识。原始逆向研究文件、个人截图和本机路径不在新版公开文件中。

## 字体

| 字体 | 来源 | 随包许可 |
| --- | --- | --- |
| Inter 4.1 | [rsms/inter](https://github.com/rsms/inter/releases/tag/v4.1) | `public/fonts/Inter-LICENSE.txt` |
| Source Han Sans CN 2.005R | [adobe-fonts/source-han-sans](https://github.com/adobe-fonts/source-han-sans/releases/tag/2.005R) | `public/fonts/SourceHanSans-LICENSE.txt` |
| JetBrains Mono 2.304 | [JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono/releases/tag/v2.304) | `public/fonts/JetBrainsMono-OFL.txt` |

字体采用 SIL OFL 1.1；不将系统字体复制进应用。历史阶段用过的 Open Sans 不在当前运行资源中。

## 图标与软件

- [Lucide](https://lucide.dev/)：界面图标，ISC / Feather 部分 MIT。
- [Simple Icons 16.0.0](https://github.com/simple-icons/simple-icons/tree/16.0.0)：Bilibili 服务图标，CC0-1.0；仍须尊重商标权。
- [dash.js](https://github.com/Dash-Industry-Forum/dash.js)：DASH 播放，BSD-3-Clause。
- React、React DOM、Electron、node-qrcode 等完整声明见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) 与 `licenses/`。

## 接口依据

- [B站开放平台](https://openhome.bilibili.com/doc)：公开平台文档没有提供本项目所需的完整全站视频搜索替代接口。
- [社区搜索请求文档](https://github.com/rinnein/bilibili-API-collect/blob/1e24c6b1889160c4c35c01416aa4239501accf5f/docs/search/search_request.md)：WBI 分类搜索的排序、时长、分区与综合搜索模块。
- [社区搜索响应文档](https://github.com/rinnein/bilibili-API-collect/blob/f6760f4be38d5b592d396b211e48c666286524de/docs/search/search_response.md)：视频统计与 `bili_user` 字段。
- [分区对照](https://github.com/rinnein/bilibili-API-collect/blob/4dc60fb0bba0e817a6fba3743daf8ad6b63a1e14/docs/video/video_zone.md)：当前 `tids` 对应的 `tid` 表，不混用 `tid_v2`。

社区资料不是服务方对接口稳定性的承诺。运行时媒体、封面和头像来自 B站及内容权利人，不因项目采用 MIT 而获得再分发授权。
