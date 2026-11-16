import { getScenario } from "../scenarios/variants";
import { referenceActivities } from "../scenarios/desktopDemo";
import { formatDuration, responseChunk, runElapsed, scenarioPacing } from "../scenarios/pacing";
import { time, id, patchThread } from "./helpers";
import type { AppState, Action } from "./types";
export function reduceScenario(s: AppState, a: Action): AppState {
  switch (a.type) {
    case "TICK": {
      let next = s;
      for (const run of s.runs) {
        if (run.status !== "running" || (run.nextAt || 0) > Date.now())
          continue;
        const thread = next.threads.find((t) => t.id === run.threadId);
        if (!thread) continue;
        const scene = getScenario(
          thread.projectId,
          run.sceneTitle || thread.title,
        );
        const now = Date.now();
        const pacing = scenarioPacing(run.effort || "高", scene.files.length);
        let updated = {
          ...run,
          nextAt: now + 110,
        };
        next = patchThread(next, thread.id, (t) => {
          let messages = t.messages.map((m) => ({
            ...m,
            tools: m.tools?.map((tool) => ({ ...tool })),
          }));
          const work = messages.find((m) => m.id === `${run.runId}-work`)!;
          if (run.step === 0) {
            work.tools = [
              { ...referenceActivities(run.runId)[0], output: scene.intro },
              {
                id: `${run.runId}-search`,
                label: "搜索工作区",
                command: scene.command,
                output: "",
                status: "running",
              },
            ];
            updated.step = 1;
            updated.phase = "正在查阅工作区";
            updated.nextAt = now + pacing.search;
          }
          if (run.step === 1) {
            const searchIndex = work.tools!.findIndex(tool => tool.id === `${run.runId}-search`);
            work.tools![searchIndex] = {
              ...work.tools![searchIndex],
              output: scene.output,
              status: "done",
            };
            if (thread.id.startsWith("desktop-demo-")) work.tools!.push(...referenceActivities(run.runId).slice(1));
            work.tools!.push({
              id: `${run.runId}-read`,
              label: scene.read,
              command: `读取 ${scene.files[0].path}`,
              output: scene.files[0].before,
              status: "running",
              file: scene.files[0].path,
            });
            updated.step = 2;
            updated.phase = "正在梳理修改方案";
            updated.nextAt = now + pacing.read;
          }
          if (run.step === 2) {
            work.tools!.forEach((tool) => (tool.status = "done"));
            work.text = `${work.text}\n\n${scene.analysis}`;
            const needsApproval = s.settings.permission !== "完全访问";
            work.tools!.push({
              id: `${run.runId}-approve`,
              label: "应用文件修改",
              command: `apply_patch · ${scene.files.length} files`,
              output: scene.analysis,
              status: needsApproval ? "approval" : "running",
            });
            updated.status = needsApproval ? "waiting" : "running";
            updated.step = needsApproval ? 5 : 6;
            updated.phase = "正在应用修改";
            updated.pausedAt = needsApproval ? now : undefined;
            updated.nextAt = now + pacing.apply;
            return { ...t, messages, status: needsApproval ? "waiting" : "running" };
          }
          if (run.step === 6) {
            work.tools?.forEach(tool => { tool.status = "done"; });
            updated.step = 3;
            updated.phase = "正在整理回复";
            updated.nextAt = now + 700;
          }
          if (run.step === 3) {
            work.tools?.forEach((tool) => (tool.status = "done"));
            let response = messages.find(
              (m) => m.id === `${run.runId}-response`,
            );
            if (!response) {
              response = {
                id: `${run.runId}-response`,
                role: "assistant",
                text: "",
                createdAt: time(),
              };
              messages.push(response);
            }
            const chunk = responseChunk(run.response, run.offset);
            updated.offset = chunk.offset;
            updated.nextAt = now + chunk.delay;
            response.text = run.response.slice(0, updated.offset);
            if (updated.offset === run.response.length) updated.step = 4;
            return run.offset === 0
              ? {
                  ...t,
                  messages,
                  files: [
                    ...t.files,
                    ...scene.files
                      .filter(
                        (f) =>
                          !t.files.some((existing) => existing.path === f.path),
                      )
                      .map((f) => ({ ...f })),
                  ],
                  terminal: [
                    ...t.terminal,
                    `$ ${scene.command}`,
                    scene.output,
                    `$ apply_patch`,
                    ...scene.files.map((f) => `Reviewed ${f.path}`),
                    "$",
                  ],
                }
              : { ...t, messages };
          }
          if (run.step === 4)
            return {
              ...t,
              messages: messages.map(message => message.id === `${run.runId}-response` ? { ...message, changes: true, duration: formatDuration(runElapsed(run, now)) } : message),
              status: "complete",
              updatedAt: Date.now(),
              unread: t.id !== s.activeThread,
            };
          return { ...t, messages };
        });
        next = {
          ...next,
          runs: next.runs
            .map((r) => (r.runId === run.runId ? updated : r))
            .filter((r) => !(r.runId === run.runId && run.step === 4)),
        };
        if (run.step === 4)
          next.automations = next.automations.map((auto) => ({
            ...auto,
            runs: auto.runs.map((item) =>
              item.threadId === thread.id
                ? { ...item, status: "已完成" }
                : item,
            ),
          }));
      }
      return next;
    }
    case "APPROVAL": {
      const run = s.runs.find((r) => r.threadId === a.id);
      if (!run) return s;
      if (a.approved) {
        const now = Date.now();
        const thread = s.threads.find(t => t.id === a.id)!;
        const scene = getScenario(thread.projectId, run.sceneTitle || thread.title);
        return {
          ...patchThread(s, a.id, (t) => ({ ...t, status: "running", messages: t.messages.map(message => ({ ...message,
            tools: message.tools?.map(tool => tool.id === `${run.runId}-approve` ? { ...tool, status: "running" } : tool),
          })) })),
          runs: s.runs.map((r) =>
            r.threadId === a.id
              ? { ...r, status: "running", step: 6, approved: true,
                pausedMs: (r.pausedMs || 0) + (r.pausedAt ? now - r.pausedAt : 0), pausedAt: undefined,
                nextAt: now + scenarioPacing(r.effort || "高", scene.files.length).apply }
              : r,
          ),
        };
      }
      return {
        ...patchThread(s, a.id, (t) => ({
          ...t,
          status: "stopped",
          messages: [
            ...t.messages.map((m) => ({
              ...m,
              tools: m.tools?.map((tool) =>
                tool.status === "approval"
                  ? { ...tool, status: "denied" }
                  : tool,
              ),
            })),
            {
              id: id(),
              role: "assistant",
              text: "已取消这次修改，保留当前文件内容。你可以调整要求后重新发送。",
              createdAt: time(),
            },
          ],
        })),
        runs: s.runs.filter((r) => r.threadId !== a.id),
        automations: s.automations.map((auto) => ({
          ...auto,
          runs: auto.runs.map((item) =>
            item.threadId === a.id ? { ...item, status: "已取消" } : item,
          ),
        })),
      };
    }
    case "STOP":
      return {
        ...patchThread(s, a.id, (t) => ({ ...t, status: "stopped" })),
        runs: s.runs.map((r) =>
          r.threadId === a.id ? { ...r, status: "stopped", pausedAt: r.pausedAt ?? Date.now() } : r,
        ),
      };
    case "RESUME": {
      const waiting = s.runs.find((r) => r.threadId === a.id)?.step === 5;
      return {
        ...patchThread(s, a.id, (t) => ({
          ...t,
          status: waiting ? "waiting" : "running",
        })),
        runs: s.runs.map((r) =>
          r.threadId === a.id
            ? { ...r, status: waiting ? "waiting" : "running",
              ...(!waiting ? {
                nextAt: (r.nextAt || Date.now()) + (r.pausedAt ? Date.now() - r.pausedAt : 0),
                pausedMs: (r.pausedMs || 0) + (r.pausedAt ? Date.now() - r.pausedAt : 0),
                pausedAt: undefined,
              } : {}) }
            : r,
        ),
      };
    }
    default:
      return s;
  }
}
