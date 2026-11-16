import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { createSeed } from "../scenarios/seed";
import { reducer } from "./reducer";
import type { AppState, Action } from "./types";
const KEY = "codex-bilibili-player:v1";
const Context = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);
function restore() {
  const fresh = createSeed();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!saved || !Array.isArray(saved.threads)) return fresh;
    const upgradeLayout = saved.settings?.layoutRevision !== 3;
    const aliases: Record<string, string> = { "GPT-6.1": "6.1 Sol", "GPT-6": "6 Sol", "GPT-6 mini": "6 Luna", "GPT-5.6": "5.6 Sol" };
    return {
      ...fresh,
      ...saved,
      ...(saved.settings?.startPage === "新任务"
        ? { page: "home", activeThread: "" }
        : saved.settings?.startPage === "项目"
          ? { page: "project" }
          : {}),
      toast: "",
      searchOpen: false,
      settings: { ...fresh.settings, ...saved.settings, ...(upgradeLayout ? { layoutRevision: 3, videoOpen: false, videoExpanded: false, homePanelOpen: false, model: aliases[saved.settings?.model] || saved.settings?.model || "6 Astra" } : {}) },
      ...(upgradeLayout ? { page: "thread", activeThread: "desktop-demo-composer", activeProject: "orbit", sidebarWidth: fresh.sidebarWidth, panelWidth: fresh.panelWidth, panelOpen: true, panelTab: "diff", tabs: ["diff"], selectedFile: "" } : {}),
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
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, restore);
  const current = useRef(state);
  current.current = state;
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(
          KEY,
          JSON.stringify({ ...current.current, savedAt: Date.now(), toast: "", searchOpen: false }),
        );
      } catch {}
    };
    const timer = setInterval(flush, 650);
    const visibility = () => {
      if (document.hidden) flush();
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      flush();
      clearInterval(timer);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (!state.runs.some((r) => r.status === "running")) return;
    const timer = setInterval(() => dispatch({ type: "TICK" }), 70);
    return () => clearInterval(timer);
  }, [state.runs.some((r) => r.status === "running")]);
  useEffect(() => {
    if (!state.toast) return;
    const timer = setTimeout(
      () => dispatch({ type: "SET", value: { toast: "" } }),
      3000,
    );
    return () => clearTimeout(timer);
  }, [state.toast]);
  return (
    <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
  );
}
export function useApp() {
  return useContext(Context)!;
}
export function useThread() {
  const { state } = useApp();
  return state.threads.find((t) => t.id === state.activeThread);
}
export function useNotify() {
  const { dispatch } = useApp();
  return (toast: string) => dispatch({ type: "SET", value: { toast } });
}
