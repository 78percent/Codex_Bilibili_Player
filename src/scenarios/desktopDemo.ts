import type { Thread, ToolCall, FileChange } from "../state/types";

export const demoFiles: FileChange[] = [
  { path: "src/app/DesktopLayout.tsx", before: "", after: [
    'import { ActivityRail } from "./ActivityRail";',
    'import { Sidebar } from "../sidebar/Sidebar";',
    'import { Conversation } from "../chat/Conversation";',
    'import { ChangesPanel } from "../review/ChangesPanel";',
    'import { VideoViewport } from "../video/VideoViewport";',
    "",
    "export function DesktopLayout() {",
    "  return (",
    '    <div className="desktop-layout">',
    "      <ActivityRail />",
    "      <Sidebar />",
    "      <Conversation />",
    '      <aside className="workspace">',
    "        <ChangesPanel />",
    "        <VideoViewport />",
    "      </aside>",
    "    </div>",
    "  );",
    "}",
  ].join("\n") },
  { path: "src/styles/layout.css", before: ".sidebar { width: 240px; }\n.chat { font-size: 13px; }", after: [
    ":root {",
    '  --font-ui: "Segoe UI", "Microsoft YaHei UI", sans-serif;',
    '  --font-code: Consolas, monospace;',
    "  --surface: #ffffff;",
    "  --sidebar-surface: #fafafa;",
    "  --window-surface: #f3f3f3;",
    "  --separator: #eeeeee;",
    "}",
    "",
    ".desktop-layout {",
    "  display: grid;",
    "  grid-template-columns: 50px 276px minmax(360px, 1fr) 1.4fr;",
    "  height: 100%;",
    "}",
    "",
    ".chat { font: 14px/1.8 var(--font-ui); }",
    ".workspace { min-width: 0; }",
    ".video-viewport { aspect-ratio: 16 / 9; }",
  ].join("\n") },
  { path: "src/video/VideoViewport.tsx", before: "", after: 'export function VideoViewport() {\n  return (\n    <section className="video-viewport">\n      <video playsInline preload="none" />\n    </section>\n  );\n}\n' },
  { path: "docs/layout-notes.md", before: "", after: "# 布局记录\n\n功能栏、会话侧栏、聊天与变更区独立布局。\n视频区域预留在变更区下方。\n" },
];

export function referenceActivities(prefix: string): ToolCall[] {
  return [
    { id: prefix + "-think", kind: "thinking", label: "已思考 12 秒", command: "", status: "done",
      output: "先确认页面的分栏关系，再整理字体、间距与活动记录的呈现方式。视频区域放在工作区底部，保持聊天输入框的位置稳定。" },
    { id: prefix + "-web", kind: "web", label: "查找了网页", command: "web.search", status: "done",
      output: "整理了桌面窗口和视频元素相关的参考页面。",
      sources: [
        { title: "BrowserWindow · Electron", url: "https://www.electronjs.org/docs/latest/api/browser-window" },
        { title: "HTML video element · MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video" },
      ] },
    { id: prefix + "-image", kind: "image", label: "查看了 1 张图片", command: "view_image", status: "done",
      output: "参照图包含独立功能栏、最近会话、聊天和变更面板。聊天输入框固定在底部，代码区域使用浅绿色差异背景。",
      image: "./workspace-reference.svg" },
  ];
}

export function createDemoThreads(now = Date.now()): Thread[] {
  const shared = { projectId: "orbit", status: "complete" as const, pr: 0, branch: "feat/desktop-layout", terminal: ["$ git diff --stat", "4 files changed", "$"], files: demoFiles.map(file => ({ ...file })) };
  return [
    { ...shared, id: "desktop-demo-layout", title: "移植 Codex 前端播放器骨架", updatedAt: now + 3000, messages: [
      { id: "layout-user", role: "user", text: "参考这张图调整聊天区、侧边栏和变更区，再留一个视频播放窗口。", createdAt: "14:25" },
      { id: "layout-process", role: "assistant", text: "我会先对齐页面结构和字体，再把视频窗口放到右侧变更区下方。", createdAt: "14:25", tools: referenceActivities("layout") },
      { id: "layout-work", role: "assistant", text: "", createdAt: "14:26", tools: [
        { id: "layout-read", label: "读取了 3 个文件", command: "读取 DesktopLayout.tsx、layout.css、VideoViewport.tsx", output: "窗口布局 → 聊天列 → 变更列\n视频区域由独立组件承载。", status: "done", file: demoFiles[0].path },
      ] },
      { id: "layout-result", role: "assistant", duration: "1 分钟 28 秒", text: "布局已调整。左侧保留独立功能栏和最近会话，聊天中的修改摘要可以直接打开右侧对应文件。\n\n视频窗口已留在右下方，可以收起或放大。", createdAt: "14:27", changes: true },
    ] },
    { ...shared, id: "desktop-demo-research", title: "查找视频渲染与窗口布局资料", updatedAt: now + 2000, messages: [
      { id: "research-user", role: "user", text: "先查一下网页，整理视频窗口和桌面分栏需要的组件。", createdAt: "11:08" },
      { id: "research-process", role: "assistant", text: "我会整理窗口容器、视频元素与分栏布局的参考资料。", createdAt: "11:08", tools: referenceActivities("research").slice(0, 2) },
      { id: "research-result", role: "assistant", duration: "42 秒", text: "可以拆成三个独立部分：\n\n- 窗口容器负责标题栏和最小尺寸。\n- 分栏组件负责聊天与变更区域的宽度。\n- 视频组件负责画面渲染区域，之后再接播放源。\n\n第一版先保持空画面，布局不依赖视频接口。", createdAt: "11:09" },
      { id: "research-followup", role: "user", text: "好的，先把窗口留出来，播放器信息以后再设计。", createdAt: "11:10" },
      { id: "research-confirm", role: "assistant", text: "已预留右下方视频区域，收起时只保留标题栏。", createdAt: "11:10" },
    ] },
    { ...shared, id: "desktop-demo-image", title: "根据截图调整字体和对话间距", updatedAt: now + 1000, messages: [
      { id: "image-user", role: "user", text: "看一下这张图片，聊天气泡、代码字体和侧边栏需要再靠近一些。", createdAt: "10:32" },
      { id: "image-process", role: "assistant", text: "我会对照截图中的文字层级和分隔线位置调整。", createdAt: "10:32", tools: referenceActivities("image").filter(t => t.kind !== "web") },
      { id: "image-result", role: "assistant", duration: "56 秒", text: "正文使用 Windows 界面字体，代码区域单独使用等宽字体。用户消息采用浅灰圆角气泡，工具记录收成可展开的一行。\n\n侧边栏仅保留项目和会话列表，把功能入口放回最左侧细栏。", createdAt: "10:33", changes: true },
    ] },
  ];
}

