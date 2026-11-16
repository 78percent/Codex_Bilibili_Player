# 正式接入记录

## 授权与执行约束

2026-11-16 用户确认最新预览：“可以，接进去吧”。执行 tasks.md 第3组，使用 executing-plans 连续实施及 requesting-code-review 独立静态审阅。用户要求接入当前本地项目，直接在当前工作区修改目标文件；不移动已有未提交成果，不创建或切换工作树，不提交 Git。

不运行测试、lint、类型检查、应用启动、OpenSpec validate、构建或打包。本轮下载静态品牌图标用于打包，不请求 B站业务接口，不读取用户运行时缓存。

## 文件映射

| 文件 | 责任 |
| --- | --- |
| `src/features/video-search/types.ts` | 显式 discovery / suggestions / results 三态及最近关键词 |
| `src/features/video-search/storage.ts` | 历史词读写、去重及旧快照迁移 |
| `src/features/video-search/VideoSearchProvider.tsx` | 输入、请求、历史记录与当前会话状态 |
| `src/features/video-search/VideoSearchDialog.tsx` | 按三态显示页面、词高亮、焦点与选片 |
| `src/features/video-search/RecentSearches.tsx` | 历史标签最多10条及3行、隐藏项不参与键盘焦点 |
| `src/features/video-search/VideoResultCard.tsx` | 四列中的视频卡片、UP标记和选片反馈 |
| `src/styles/video-search.css` | 预览的浮层、轻焦点、热搜、历史、卡片及图标样式 |
| `src/assets/icons/bilibili.svg` | 与预览相同的 Simple Icons 16.0.0 B站图形，随应用本地打包 |
| `src/app/ActivityRail.tsx` | 替换手绘小电视，打开搜索时关闭观看记录浮层 |

沿用现有 `hotSearch`、`searchSuggestions`、`searchVideos` IPC 和 `playSearchVideo(bvid)` 共享播放入口。当前播放器已有设置、字幕、弹幕、观看记录与恢复位置相关更改，本轮不修改这些模块。

## 存储决策

- 历史使用 `codex-bilibili-player:video-search-history:v2:<account>`，内容仅 `{ recent: string[] }`。
- 提交搜索时去重、置顶、保留10条；未改变最前关键词时不重复写入。输入、结果到达、滚动及关闭不写存储。
- `codex-bilibili-player:video-search:v1:<account>` 仅在对应账号加载历史时迁移：若没有新历史则提取旧 `result.keyword`，移除该账号旧快照，再存历史词。不会把草稿当历史，不扫描或删除其他业务键。
- 结果、输入、页码和滚动仍保留在当前会话内存，关闭再打开可继续；重启重新显示热搜和历史。
- 迁移代码已写入；本轮没有执行应用或直接操作用户浏览器存储。

## 状态

源码接入及独立静态审阅已完成，未发现需要修复的高置信度重要缺陷。审阅覆盖三态切换、历史去重及账号隔离、旧快照迁移、会话内结果保留、三行历史限制和共享播放调用。

用户已确认的是设计预览；接入后的运行、视觉与真实接口表现未验证。未运行测试、lint、类型检查、启动、构建或打包，现有 exe 未更新。保留本地并行的播放器、观看记录、账号和会话修改，未提交 Git。
