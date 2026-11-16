# Bilibili 真实数据接入：需求对齐记录

日期：2026-11-16
状态：用户已确认两个视频位置并明确开始开发；实现和静态审查记录见 implementation.md。

## 最新修改（优先于下方历史记录）

- 登录增加为三个入口：扫码、B站账号密码、手机验证码；登录后检查绑定手机号的要求保留。
- 视频在桌面 EXE 内作为 Codex 图片容器风格的卡片嵌入 mock 聊天记录，拖动边缘或角落调整尺寸；iframe 为可选举例。
- 用户确认两个位置都保留，聊天卡片与右侧共用播放会话。
- 已确认官方登录页的密码/短信页签，三种入口实施完成，实际登录待验收。

## 用户已确认

- 使用 B 站账号登录，可采用扫码；登录后必须确认账号已绑定手机号。不建立独立手机号账号体系。
- 首次播放取本软件登录后的首页推荐，按顺序选择首个普通视频，跳过广告和直播。
- 第一版实现基础播放和清晰度切换，仅展示当前账号对当前视频实际可用的画质。
- 本机记住登录，重启保留登录状态；主动退出或检测到登录过期后才要求重新登录。提供退出登录入口。
- 左下角齿轮下方显示 B 站头像，增加 Codex 风格的 profile 页面。
- Profile 接入真实头像、昵称、UID、会员和手机号绑定状态，并提供退出登录。
- 收藏夹、观看历史和关注列表第一版仅保留入口，不接真实业务。
- 用户选择路线 A：扫码 + 主站社区接口 + 自有播放器，沿用现有 UI，集中封装接口。
- 用户授权子 agent 使用 REA 研究本机 Codex 的相关界面；本轮只读静态研究，不操作或重启运行中的 Codex。
- 先对齐需求、提供方案；使用 superpowers 和 grill-me，避免防御性编程。
- 后续由 code reviewer 检查实现。运行验收限于前端样式是否崩塌和视频功能正常运行，不运行 lint、类型检查或其他测试。

## 已完成的调查

- 现有工程为 Electron + React + TypeScript；VideoDock 已有空 video 元素。
- 左侧齿轮实际位于 src/app/ActivityRail.tsx，头像入口应增加在此处。
- 官方开放平台支持 OAuth，要求入驻和申请应用；获批 scope 不等同于主站 Cookie 权限。尚未找到足以确认首页推荐与任意视频播放的官方开放能力。
- bilibili-plugins/bilibili-api-collect 是社区接口文档，涵盖扫码、短信、首页推荐、播放地址和 WBI；不是直接可用的 SDK。
- 社区登录信息文档有 mobile_verified 字段；这是绑定状态，不是具体手机号对应关系。实际接入返回尚未验证。
- wiliwili 为可参考的完整客户端；本轮调研时仓库未归档。Nemo2011/bilibili-api 和 PiliPala 在本轮查询时显示归档。

来源：
- https://openhome.bilibili.com/doc
- https://open.bilibili.com/doc/4/eaf0e2b5-bde9-b9a0-9be1-019bb455701c
- https://github.com/bilibili-plugins/bilibili-api-collect
- https://github.com/bilibili-plugins/bilibili-api-collect/blob/master/docs/login/login_info.md
- https://github.com/bilibili-plugins/bilibili-api-collect/blob/master/docs/video/videostream_url.md
- https://github.com/xfangfang/wiliwili

## 提议，尚未确认为最终设计

- Electron 主进程负责 B 站请求和本地凭证存储，前端按登录、推荐、播放器、profile 分模块。
- 使用现有 video 窗口和自有播放控件；清晰度切换保留进度。播放器依赖待确定。
- 不把网络失败当作登录过期；无法确认手机号状态时不伪装为已绑定。
- 不增加多套接口自动切换或后台重试框架。
- Profile 建议采用“底部头像 → 账号菜单 → Profile 页面”。子 agent 在当前安装包 26.1111.2228.0 的静态源码中找到 profileFooter.openProfileMenu 与 profileDropdown.profile；另一个 Edit profile 对话框不属于本次资料展示需求。完整 Profile 页面布局尚未确认，不声称像素级复刻。
- 收藏夹、观看历史和关注入口建议保留为禁用菜单项，不打开假数据页面。

## 待解决

- 收藏夹、观看历史、关注列表入口的占位交互由设计方案明确，不显示虚构业务数据。
- 本机 Codex 头像菜单静态研究已收束，详见 docs/research/codex-profile-2026-11-16/findings.md；完整 Profile 主页面布局未确认。
- 用户已选择路线 A，正式设计见 design.md，等待审阅批准；之后细化实施任务。
- 已提供三条路线供选择：A 扫码 + 社区主站接口 + 自有播放器（推荐）；B 社区首页接口 + B站网页播放器；C 先申请官方开放能力，暂缓推荐与播放接入。
- 最终设计批准后同步旧 AGENTS.md / openspec/config.yaml 的阶段限制，保留其余约束。

## 进度与证据边界

仅完成公开文档调查和项目源码阅读；未登录 B 站、未运行测试、未启动应用、未验证实际视频播放。静态接口文档和第三方客户端功能不构成本工程运行成功的证据。
