import type { Subagent } from "../state/types";

// Local demonstration records; these do not start agent tasks.
export const demoSubagents: Record<string, Subagent[]> = {
  "desktop-demo-composer": [
    { id: "layout", name: "布局", task: "整理窗口分栏与组件间距", status: "complete", icon: "Radar", color: "rose" },
    { id: "typography", name: "字体", task: "整理正文、标题与代码文字层级", status: "complete", icon: "Aperture", color: "blue" },
    { id: "interaction", name: "交互", task: "整理侧栏悬停与展开状态", status: "complete", icon: "Hourglass", color: "cyan" },
  ],
};
