# Codex 页面与状态清单

日期：2026-11-12。对应《Codex前端复刻设计》。此清单锁定实现范围；注册存在与运行时可见性分别记录。

## A. 前端交付页面

| 编号 | 页面 | 必做状态与操作 |
| --- | --- | --- |
| A01 | 新任务 | 空白输入、项目/环境/模型选择、附件、提交 |
| A02 | 会话详情 | 历史消息、流式生成、计划、工具展开、等待批准、停止、完成、继续 |
| A03 | 项目首页 | 项目列表、项目会话、创建/重命名/移除、项目选项 |
| A04 | 搜索 | 输入、匹配列表、无结果、选择结果 |
| A05 | 归档 | 列表、搜索、恢复、删除 |
| A06 | 自动化列表 | 活跃/暂停、空列表、新建、删除 |
| A07 | 自动化详情 | 调度编辑、运行历史、手动运行、启停 |
| A08 | 技能列表 | 搜索、本地/可用、启停 |
| A09 | 技能详情 | 说明、文件预览、模拟安装/移除 |
| A10 | 应用与插件 | 列表、搜索、详情、模拟连接/断开/安装 |
| A11 | 审查列表 | PR 列表、状态筛选、选择 PR |
| A12 | 审查详情 | 文件树、差异、行评论、暂存切换、模拟提交与 PR 更新 |
| A13 | 文件工作区 | 文件树、标签、虚构代码编辑、保存至本地演示状态 |
| A14 | 终端面板 | 历史日志、预设命令输入、运行状态、清空、标签 |
| A15 | 浏览器面板 | 本地预置页面、地址显示、标签、导航演示 |
| A16 | Work/内容列表 | 项目内容、最近内容、筛选、预览 |
| A17 | 文档预览 | Markdown/报告/表格等预置文档、切换标签 |
| A18 | 设置 | 下表中的明确注册分组；控件按职责分别实现 |
| A19 | 关于与来源 | 独立演示应用说明、原版参照版本、资源来源 |

页面名称以最终定位到的原版中文文案为准。布局和导航层级按原版组件恢复，不把这张清单直接变成 19 个一级导航按钮。

## B. 设置注册清单

来源：`webview/assets/async/499225.6d2e47bea2.js`，模块 `n74t`。注册表中的名字是源码 key，不是界面文案。

直接围绕 Codex 开发工作流的分组：

`general-settings`、`appearance`、`notifications`、`keyboard-shortcuts`、`agent`、`work-settings`、`git-settings`、`archived-chats`、`code-review`、`cloud-settings`、`codex-cloud`、`cloud-environments`、`local-environments`、`worktrees`、`environments`、`mcp-settings`、`hooks-settings`、`connections`、`plugins-settings`、`file-type-handlers`、`skills-settings`、`computer-use`、`browser-use`、`extension`、`storage`、`import`、`personalization`、`usage`。

同包中注册的账户、共享产品与其他分组也纳入独立页面数据模型，保持各自入口可配置：

`gateways`、`rosalind`、`billing`、`profile`、`security`、`account`、`age`、`agreements`、`family`、`parental-controls`、`trusted-contact`、`safety`、`time-management`、`codex-micro`、`appshots`、`voice`、`pets`、`ads-controls`、`data-controls`、`chronicle`、`debug`、`cloud-computer`、`passwords`、`teams`。

别名：`analytics`、`usage-code-review`、`consumer-view` 复用 Usage 页面。`family` 在原版注册表复用 General 页面。开源许可证有独立注册组件。

这些 key 证实页面注册存在，但不证明当前用户账号都能看到。默认导航优先恢复 Codex 工作区入口，共享产品入口依据原版可见结构组织；不为了展示注册表而在默认侧栏塞入实验模块。账户、支付、密码、安全类页面只使用虚构状态，不处理真实账户、密码或支付信息。

每个设置页有对应的控件和本地状态；不能所有页面都套用同一组无关开关。页面数据、布局组件与持久化分离。

## C. 共用弹层与交互状态

必须实现：项目选择、新建项目、模型选择、推理强度、环境选择、附件选择、会话重命名、会话上下文菜单、项目上下文菜单、搜索/命令面板、归档/删除确认、自动化编辑、技能详情、插件详情、连接编辑、分支选择、提交/PR 弹窗、通知/账户菜单、外观选择。

共用状态：默认、悬停、按下、焦点、已选、不可用、空列表、加载、错误提示。菜单支持键盘和 Escape，弹窗关闭后恢复触发点焦点。加载与错误来自场景脚本，不能用随机失败制造“真实感”。

## D. 已找到的样式依据

来源：`webview/assets/async/e77f816560c6.css`。

- 基础 spacing：`.25rem`。
- 过渡：basic `.15s`，moderate `.2s`，relaxed `.3s`。
- 曲线：`cubic-bezier(.4,0,.2,1)`；snappy `cubic-bezier(.23,1,.32,1)`；另有原版分段线性 spring。
- UI 字体：系统字体链，Windows 包含 Segoe UI；代码字体链包含 Consolas。
- 输入区圆角存在多布局覆盖，不能把单个值用于所有状态。
- 侧栏包含行操作显隐、行图标替换、拖动状态、顶部滚动渐隐与底部高度变量。
- 主题颜色通过语义变量与 `light-dark()` 分配。

同名变量在不同选择器下有覆盖。实施时保留对应选择器和上下文，不把所有值压成一个“原版值”。

## E. 研究状态

已读：原包文件清单、四个入口的 REA 分析、目标 bundle 的静态文本、全局样式、设置注册表、界面消息 ID。

未取得：当前窗口画面（界面读取工具超时），完整运行时路由可达性，以及动画连续观感。实施依据静态来源推进；1:1 是设计目标，实际观感由用户打开后审阅。未运行任何测试。
