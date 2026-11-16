import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { restore, persist } from "./persistence";
import { reducer } from "./reducer";
import type { AppState, Action } from "./types";

const Context = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, restore);
  const current = useRef(state);
  current.current = state;
  useEffect(() => {
    let lastSaved: AppState | null = null;
    const flush = () => {
      if (current.current === lastSaved) return;
      try {
        persist(current.current);
        lastSaved = current.current;
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
