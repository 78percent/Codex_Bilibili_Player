import { createSeed } from "../scenarios/seed";
import type { AppState } from "./types";
const KEY = "codex-bilibili-player:v1";
export function restore(): AppState {
  const fresh = createSeed();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!saved || !Array.isArray(saved.threads)) return fresh;
    const record = (value: any) => value !== null && typeof value === 'object' && !Array.isArray(value);
    // Missing or damaged collections must not override usable seed collections.
    for (const key of ['projects', 'runs', 'automations']) {
      if (!Array.isArray(saved[key]) || !saved[key].every(record)) saved[key] = fresh[key as 'projects' | 'runs' | 'automations'];
    }
    for (const key of ['installed', 'connected', 'tabs']) {
      if (!Array.isArray(saved[key]) || !saved[key].every((item: unknown) => typeof item === 'string')) saved[key] = fresh[key as 'installed' | 'connected' | 'tabs'];
    }
    if (!record(saved.settings)) saved.settings = {};
    saved.threads = saved.threads.filter((thread: any) => record(thread) && typeof thread.id === 'string' && typeof thread.title === 'string'
      && Array.isArray(thread.messages) && thread.messages.every((message: any) => record(message) && typeof message.text === 'string')
      && Array.isArray(thread.files) && thread.files.every((file: any) => record(file) && typeof file.path === 'string' && typeof file.before === 'string' && typeof file.after === 'string')
      && Array.isArray(thread.terminal) && thread.terminal.every((line: unknown) => typeof line === 'string'));
    const upgradeLayout = saved.settings?.layoutRevision !== 3;
    const aliases: Record<string, string> = { "GPT-6.1": "6.1 Sol", "GPT-6": "6 Sol", "GPT-6 mini": "6 Luna", "GPT-5.6": "5.6 Sol" };
    return {
      ...fresh,
      ...saved,
      sidebarWidth: saved.sidebarWidth === 276 ? fresh.sidebarWidth : saved.sidebarWidth ?? fresh.sidebarWidth,
      ...(saved.settings?.startPage === "新任务"
        ? { page: "home", activeThread: "" }
        : saved.settings?.startPage === "项目"
          ? { page: "project" }
          : {}),
      toast: "",
      searchOpen: false,
      settings: { ...fresh.settings, ...saved.settings, ...(upgradeLayout ? { layoutRevision: 3, videoOpen: false, videoExpanded: false, model: aliases[saved.settings?.model] || saved.settings?.model || "6 Astra" } : {}), homePanelOpen: false, showDiff: false },
      ...(upgradeLayout ? { page: "thread", activeThread: "desktop-demo-composer", activeProject: "orbit", sidebarWidth: fresh.sidebarWidth, panelWidth: fresh.panelWidth, panelTab: "diff", tabs: ["diff"], selectedFile: "" } : {}),
      // Start with the workspace collapsed even when the previous session saved it open.
      panelOpen: false,
      runs: (saved.runs || []).map((r: any) => ({
        ...r,
        status: r.status === "running" ? "stopped" : r.status,
        pausedAt: r.pausedAt ?? (r.status === "running" ? saved.savedAt || Date.now() : undefined),
      })),
      threads: [...(upgradeLayout ? fresh.threads.filter(t => t.id.startsWith("desktop-demo-") && !saved.threads.some((old: any) => old.id === t.id)) : []), ...saved.threads.map((t: any) => ({
        ...t,
        status: t.status === "running" ? "stopped" : t.status,
      }))],
    };
  } catch {
    return fresh;
  }
}

export function persist(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now(), toast: "", searchOpen: false }));
}
