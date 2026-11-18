import { scenarios } from "../scenarios";
import { getScenario } from "../scenarios/variants";
import type { AppState, Action, Thread, Message, Run } from "./types";
import { time, id, patchThread } from "./helpers";
import { reduceScenario } from "./scenarioReducer";
import { scenarioPacing } from "../scenarios/pacing";
export function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case "SET":
      return { ...s, ...a.value };
    case "NAVIGATE":
      return {
        ...s,
        page: a.page,
        ...(a.page === "home" ? { activeThread: "", settings: { ...s.settings, homePanelOpen: false, newChatProjectPicked: false } } : {}),
      };
    case "SELECT_THREAD": {
      const t = s.threads.find((t) => t.id === a.id);
      return t
        ? {
            ...s,
            page: "thread",
            activeThread: t.id,
            activeProject: t.projectId,
            selectedFile: "",
            threads: s.threads.map((x) =>
              x.id === t.id ? { ...x, unread: false } : x,
            ),
          }
        : s;
    }
    case "UPDATE_THREAD":
      return patchThread(s, a.id, (t) => ({ ...t, ...a.patch }));
    case "EDIT_MESSAGE":
      return patchThread(s, a.threadId, (t) => ({
        ...t,
        messages: t.messages.map(message => message.id === a.messageId && message.role === "user"
          ? { ...message, text: a.text } : message),
      }));
    case "DELETE_PROJECT": {
      const projects = s.projects.filter((p) => p.id !== a.id);
      const affected = new Set(
        s.threads.filter((t) => t.projectId === a.id).map((t) => t.id),
      );
      return {
        ...s,
        projects,
        threads: s.threads.map((t) =>
          affected.has(t.id)
            ? {
                ...t,
                archived: true,
                status:
                  t.status === "running" || t.status === "waiting"
                    ? "stopped"
                    : t.status,
              }
            : t,
        ),
        runs: s.runs.filter((r) => !affected.has(r.threadId)),
        automations: s.automations.map((auto) =>
          auto.projectId === a.id ? { ...auto, active: false } : auto,
        ),
        activeProject: projects[0]?.id || "atlas",
        activeThread: "",
        page: "home",
      };
    }
    case "DELETE_THREAD": {
      const threads = s.threads.filter((t) => t.id !== a.id);
      return {
        ...s,
        threads,
        runs: s.runs.filter((r) => r.threadId !== a.id),
        automations: s.automations.map((auto) => ({
          ...auto,
          runs: auto.runs.map((item) =>
            item.threadId === a.id ? { ...item, status: "任务已删除" } : item,
          ),
        })),
        page: s.activeThread === a.id ? "home" : s.page,
        activeThread: s.activeThread === a.id ? "" : s.activeThread,
      };
    }
    case "NEW_THREAD": {
      const threadId = a.id || id();
      const projectId = a.projectId || s.activeProject;
      const scene = scenarios[projectId] || scenarios.atlas;
      const thread: Thread = {
        id: threadId,
        title: "新任务",
        projectId,
        messages: [],
        updatedAt: Date.now(),
        status: "idle",
        files: [],
        pr: 0,
        branch: scene.branch,
        terminal: ["$"],
      };
      return {
        ...s,
        page: "thread",
        activeProject: projectId,
        activeThread: threadId,
        settings: { ...s.settings, newChatProjectPicked: true, homePanelOpen: false },
        selectedFile: "",
        threads: [thread, ...s.threads],
      };
    }
    case "SEND": {
      if (!s.activeThread || s.page === "home")
        return reducer(reducer(s, { type: "NEW_THREAD" }), a);
      if (s.runs.some((r) => r.threadId === s.activeThread)) return s;
      const t = s.threads.find((t) => t.id === s.activeThread)!;
      const scene = getScenario(t.projectId, a.text + " " + t.title);
      const runId = id();
      const run = {
        threadId: t.id,
        runId,
        step: 0,
        offset: 0,
        status: "running",
        response: scene.response,
        sceneTitle: scene.title,
        startedAt: Date.now(),
        pausedMs: 0,
        effort: s.settings.effort,
        phase: "正在理解需求",
        nextAt: Date.now() + scenarioPacing(s.settings.effort, scene.files.length).understand,
      } as Run;
      const next = patchThread(s, t.id, (thread) => ({
        ...thread,
        status: "running",
        updatedAt: Date.now(),
        title: thread.messages.length ? thread.title : a.text.slice(0, 28),
        messages: [
          ...thread.messages,
          {
            id: id(),
            role: "user",
            text: a.text,
            createdAt: time(),
            attachments: a.attachments,
          },
          {
            id: `${runId}-work`,
            role: "assistant",
            text: scene.intro,
            plan: scene.plan,
            tools: [{ id: `${runId}-thinking`, kind: "thinking", label: "正在思考", command: "", output: "正在整理当前请求与工作区信息。", status: "running" }],
            createdAt: time(),
          },
        ],
      }));
      return { ...next, page: "thread", runs: [...next.runs, run] };
    }
    case "TICK":
    case "APPROVAL":
    case "STOP":
    case "RESUME":
      return reduceScenario(s, a);
    case "SETTINGS":
      return {
        ...s,
        settings: { ...s.settings, ...a.value },
        ...("showDiff" in a.value ? { panelOpen: a.value.showDiff } : {}),
      };
    case "INSTALL":
      return {
        ...s,
        installed: s.installed.includes(a.id)
          ? s.installed.filter((x) => x !== a.id)
          : [...s.installed, a.id],
      };
    case "CONNECT":
      return {
        ...s,
        connected: s.connected.includes(a.id)
          ? s.connected.filter((x) => x !== a.id)
          : [...s.connected, a.id],
      };
    case "AUTOMATION":
      return {
        ...s,
        automations: s.automations.some((x) => x.id === a.item.id)
          ? s.automations.map((x) => (x.id === a.item.id ? a.item : x))
          : [...s.automations, a.item],
      };
    case "DELETE_AUTOMATION":
      return { ...s, automations: s.automations.filter((x) => x.id !== a.id) };
    case "RUN_AUTOMATION": {
      const auto = s.automations.find((x) => x.id === a.id);
      if (!auto) return s;
      const threadId = id();
      let next = reducer(s, {
        type: "NEW_THREAD",
        id: threadId,
        projectId: auto.projectId,
      });
      next = reducer(next, { type: "SEND", text: auto.prompt });
      return {
        ...next,
        automations: next.automations.map((x) =>
          x.id === auto.id
            ? {
                ...x,
                runs: [{ at: time(), threadId, status: "运行中" }, ...x.runs],
              }
            : x,
        ),
      };
    }
    case "FILE_EDIT":
      return patchThread(s, s.activeThread, (t) => ({
        ...t,
        files: t.files.map((f) =>
          f.path === a.path ? { ...f, after: a.text } : f,
        ),
      }));
    case "TERMINAL":
      return patchThread(s, s.activeThread, (t) => ({
        ...t,
        terminal: [...t.terminal, `$ ${a.command}`, a.output, "$"],
      }));
    default:
      return s;
  }
}
