import { demoFiles } from "./desktopDemo";
export const desktopScenario = {
  title: "移植 Codex 前端播放器骨架",
  branch: "feat/desktop-layout",
  pr: 0,
  prompt: "按截图整理桌面布局，并保留视频渲染窗口。",
  intro: "我会沿着侧边栏、聊天和变更面板的组件结构整理这次调整。",
  plan: ["整理截图与页面布局", "更新聊天和变更区域", "保留独立视频窗口"],
  command: "读取 DesktopLayout.tsx、layout.css、VideoViewport.tsx",
  output: "ActivityRail → Sidebar → Conversation → ChangesPanel\nVideoViewport 位于工作区下方。",
  read: "读取了 3 个文件",
  analysis: "布局组件和视频容器分别维护，修改只影响当前演示工作区。",
  response: "已整理本轮界面调整。聊天里的文件摘要与右侧变更区关联，过程记录可以展开查看。\n\n视频渲染窗口保留在右下方，可以收起或放大，播放源继续留空。",
  followups: [],
  files: demoFiles,
};
