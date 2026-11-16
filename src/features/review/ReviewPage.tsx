import { useState } from "react";
import { useApp, useThread, useNotify } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { Button } from "../../components/ui/Button";
import { EditDialog } from "../../components/ui/EditDialog";
import { DiffView } from "./DiffView";
export function ReviewPage() {
  const { state, dispatch } = useApp();
  const thread = useThread();
  const notify = useNotify();
  const [commit, setCommit] = useState(false);
  const [filter, setFilter] = useState("");
  const candidates = state.threads.filter(
    (t) =>
      t.files.length && t.title.toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <div className="review-page">
      <aside className="review-list">
        <h2>代码审查</h2>
        <div className="search-input compact">
          <Icon name="Search" size={15} />
          <input
            placeholder="搜索拉取请求"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {candidates.map((t) => (
          <button
            className={t.id === thread?.id ? "selected" : ""}
            key={t.id}
            onClick={() => {
              dispatch({ type: "SELECT_THREAD", id: t.id });
              dispatch({ type: "NAVIGATE", page: "review" });
            }}
          >
            <Icon name="GitPullRequest" size={18} />
            <span>
              {t.title}
              <small>
                {state.projects.find((p) => p.id === t.projectId)?.name} · #
                {t.pr || "草稿"}
              </small>
            </span>
            <span className="status-dot" />
          </button>
        ))}
      </aside>
      <div className="review-main">
        <div className="review-heading">
          <div>
            <span className="eyebrow">
              <Icon name="GitBranch" size={13} />
              {thread?.branch}
            </span>
            <h2>{thread?.title || "选择一个拉取请求"}</h2>
          </div>
          <div className="review-actions">
            <span className="status-pill">{thread?.prState || "Open"}</span>
            <Button icon="GitCommitHorizontal" onClick={() => setCommit(true)}>
              提交
            </Button>
            <Button
              variant="primary"
              icon="GitPullRequest"
              onClick={() => {
                if (thread) {
                  dispatch({
                    type: "UPDATE_THREAD",
                    id: thread.id,
                    patch: {
                      prState: thread.prState === "Merged" ? "Open" : "Merged",
                    },
                  });
                  notify(
                    thread.prState === "Merged"
                      ? "已重新打开本地 PR"
                      : "已合并本地 PR",
                  );
                }
              }}
            >
              {thread?.prState === "Merged" ? "重新打开" : "合并"}
            </Button>
          </div>
        </div>
        <DiffView expanded />
        {commit && (
          <EditDialog
            title="提交更改"
            label="提交消息"
            initial={`refactor: ${thread?.title || ""}`}
            onClose={() => setCommit(false)}
            onSave={(message: string) => {
              if (thread) {
                dispatch({
                  type: "UPDATE_THREAD",
                  id: thread.id,
                  patch: {
                    committed: true,
                    files: thread.files.map((f) => ({ ...f, staged: true })),
                    terminal: [
                      ...thread.terminal,
                      `[${thread.branch}] ${message}`,
                    ],
                  },
                });
                notify("本地提交记录已创建");
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
