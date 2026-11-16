import type { AppState, Thread } from "./types";
export const time = () =>
  new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
export const id = () => crypto.randomUUID();
export const patchThread = (
  s: AppState,
  threadId: string,
  fn: (t: Thread) => Thread,
) => ({ ...s, threads: s.threads.map((t) => (t.id === threadId ? fn(t) : t)) });
