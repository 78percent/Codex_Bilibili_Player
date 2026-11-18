import { projects, scenarios } from "./index";
import { getScenario } from "./variants";
import { createDemoThreads } from "./desktopDemo";
import { createComposerDemo } from "./composerDemo";
import type { AppState, Thread, Message } from "../state/types";
export function createSeed(): AppState {
  const now = Date.now();
  const threads: Thread[] = projects.flatMap((project, p) => {
    const base = scenarios[project.id];
    return [base.title, ...base.followups].map((title, i) => {
      const scene = getScenario(project.id, title, i - 1);
      const id = `${project.id}-${i}`;
      const prompt =
        i === 0
          ? scene.prompt
          : `继续处理${title}，结合当前分支中的改动整理实现。`;
      const messages: Message[] = [
        { id: `${id}-user`, role: "user", text: prompt, createdAt: "09:41" },
        {
          id: `${id}-analysis`,
          role: "assistant",
          text: scene.intro,
          createdAt: "09:42",
          plan: scene.plan,
          tools: [
            {
              id: `${id}-search`,
              label: "搜索工作区",
              command: scene.command,
              output: scene.output,
              status: "done",
            },
            {
              id: `${id}-read`,
              label: scene.read,
              command: `读取 ${scene.files[0].path}`,
              output: scene.files[0].before || scene.files[0].after,
              status: "done",
              file: scene.files[0].path,
            },
          ],
        },
        {
          id: `${id}-finding`,
          role: "assistant",
          text: scene.analysis,
          createdAt: "09:43",
          tools: [
            {
              id: `${id}-patch`,
              label: `更新 ${scene.files.length} 个文件`,
              command: `apply_patch · ${scene.branch}`,
              output: scene.files.map((f) => `M ${f.path}`).join("\n"),
              status: "done",
            },
          ],
        },
        {
          id: `${id}-result`,
          role: "assistant",
          text: scene.response,
          changes: true,
          duration: "1 分钟 12 秒",
          createdAt: "09:46",
        },
      ];
      if (i === 0)
        messages.push(
          {
            id: `${id}-followup`,
            role: "user",
            text: "把关键改动放到右侧，我想逐个文件看一下。",
            createdAt: "09:48",
          },
          {
            id: `${id}-followup-result`,
            role: "assistant",
            text: `已整理到右侧审查面板。先看 \`${scene.files[0].path}\`，它决定了这次修改的主要行为；其余文件围绕同一条数据流调整。`,
            createdAt: "09:48",
          },
        );
      return {
        id,
        projectId: project.id,
        title,
        messages,
        updatedAt: now - (p * 5 + i) * 1000 * 60 * 47,
        pinned: i === 0 && p < 2,
        status: "complete",
        files: scene.files.map((f) => ({ ...f })),
        pr: scene.pr + i,
        branch: scene.branch,
        terminal: [
          `$ git status --short`,
          ...scene.files.map((f) => ` M ${f.path}`),
          `$ git diff --stat`,
          `${scene.files.length} files changed`,
          "$",
        ],
      };
    });
  });
  return {
    page: "thread",
    activeThread: "desktop-demo-composer",
    activeProject: "orbit",
    projects: [...projects],
    threads: [createComposerDemo(now), ...createDemoThreads(now), ...threads],
    runs: [],
    automations: [
      {
        id: "auto-review",
        name: "每日代码审查",
        prompt: "整理最近提交的代码差异，聚焦权限与缓存边界。",
        projectId: "atlas",
        schedule: "工作日 09:00",
        active: true,
        runs: [{ at: "今天 09:00", threadId: "atlas-0", status: "已完成" }],
      },
      {
        id: "auto-pipeline",
        name: "分区处理日报",
        prompt: "汇总已提交分区与检查点，生成处理日报。",
        projectId: "prism",
        schedule: "每天 18:30",
        active: true,
        runs: [{ at: "昨天 18:30", threadId: "prism-0", status: "已完成" }],
      },
      {
        id: "auto-orders",
        name: "订单事件巡检",
        prompt: "检查重复事件处理路径并整理迁移记录。",
        projectId: "harbor",
        schedule: "每周一 10:00",
        active: false,
        runs: [],
      },
    ],
    settings: {
      theme: "light",
      fontSize: "14",
      codeFontSize: "13",
      density: "舒适",
      model: "6 Astra",
      layoutRevision: 3,
      videoOpen: false,
      homePanelOpen: false,
      effort: "高",
      environment: "本地",
      notifications: true,
      language: "简体中文",
      reducedMotion: false,
      showDiff: false,
    },
    installed: [
      "frontend-design",
      "code-review",
      "pdf",
      "systematic-debugging",
    ],
    connected: ["github", "figma"],
    sidebarOpen: true,
    sidebarWidth: 288,
    panelOpen: false,
    panelWidth: Math.max(380, Math.round((window.innerWidth - 326) * 0.65)),
    panelTab: "diff",
    tabs: ["diff"],
    selectedFile: "",
    searchOpen: false,
    toast: "",
    workTab: "all",
  };
}
