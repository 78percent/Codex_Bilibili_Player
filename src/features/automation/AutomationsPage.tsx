import { useState } from "react";
import { useApp } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { Button, IconButton } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { ConfirmDialog } from "../../components/ui/EditDialog";
function AutomationEditor({ item, onClose }: any) {
  const { state, dispatch } = useApp();
  const [draft, setDraft] = useState(
    item || {
      id: crypto.randomUUID(),
      name: "",
      prompt: "",
      projectId: state.activeProject,
      schedule: "每天 09:00",
      active: true,
      runs: [],
    },
  );
  const set = (key: string, value: any) => setDraft({ ...draft, [key]: value });
  return (
    <Dialog title={item ? "编辑自动化" : "新建自动化"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.name.trim() && draft.prompt.trim()) {
            dispatch({ type: "AUTOMATION", item: draft });
            onClose();
          }
        }}
      >
        <div className="dialog-body">
          <label className="field">
            名称
            <input
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </label>
          <label className="field">
            提示词
            <textarea
              rows={5}
              value={draft.prompt}
              onChange={(e) => set("prompt", e.target.value)}
              required
              placeholder="你希望 Codex 定期完成什么？"
            />
          </label>
          <div className="form-grid">
            <label className="field">
              项目
              <select
                value={draft.projectId}
                onChange={(e) => set("projectId", e.target.value)}
              >
                {state.projects.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              计划
              <input
                value={draft.schedule}
                onChange={(e) => set("schedule", e.target.value)}
              />
            </label>
          </div>
        </div>
        <footer>
          <Button type="button" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary">保存</Button>
        </footer>
      </form>
    </Dialog>
  );
}
export function AutomationsPage() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = useState<any>(undefined);
  const [selected, setSelected] = useState("");
  const [deleting, setDeleting] = useState("");
  const item = state.automations.find((a) => a.id === selected);
  return (
    <div className="page-scroll">
      <div className="page-container">
        <div className="page-heading">
          <div>
            <h1>自动化</h1>
          </div>
          <Button
            variant="primary"
            icon="Plus"
            onClick={() => setEditing(null)}
          >
            新建自动化
          </Button>
        </div>
        <div className="automation-grid">
          {state.automations.map((a) => (
            <article
              key={a.id}
              className={`automation-card ${selected === a.id ? "selected" : ""}`}
            >
              <div className="card-top">
                <span className="card-icon">
                  <Icon name="Clock3" size={22} />
                </span>
                <button
                  role="switch"
                  aria-label={`启用 ${a.name}`}
                  aria-checked={a.active}
                  className={`switch ${a.active ? "on" : ""}`}
                  onClick={() =>
                    dispatch({
                      type: "AUTOMATION",
                      item: { ...a, active: !a.active },
                    })
                  }
                >
                  <span />
                </button>
              </div>
              <button
                className="card-title"
                onClick={() => setSelected(selected === a.id ? "" : a.id)}
              >
                {a.name}
              </button>
              <p>{a.prompt}</p>
              <div className="card-meta">
                <Icon name="CalendarClock" size={14} />
                {a.schedule}
              </div>
              <div className="card-footer">
                <span>
                  {state.projects.find((p) => p.id === a.projectId)?.name}
                </span>
                <IconButton
                  icon="Play"
                  label="立即运行"
                  onClick={() => dispatch({ type: "RUN_AUTOMATION", id: a.id })}
                />
                <IconButton
                  icon="Pencil"
                  label="编辑"
                  onClick={() => setEditing(a)}
                />
                <IconButton
                  icon="Trash2"
                  label="删除"
                  onClick={() => setDeleting(a.id)}
                />
              </div>
            </article>
          ))}
        </div>
        {!state.automations.length && (
          <div className="empty-state">
            <Icon name="Clock3" size={30} />
            <p>创建你的第一个自动化</p>
          </div>
        )}
        {item && (
          <section className="run-history">
            <h3>{item.name} · 运行记录</h3>
            {item.runs.length ? (
              item.runs.map((run, i) => (
                <button
                  key={i}
                  disabled={!state.threads.some((t) => t.id === run.threadId)}
                  onClick={() =>
                    dispatch({ type: "SELECT_THREAD", id: run.threadId })
                  }
                >
                  <Icon
                    name={
                      run.status === "运行中" ? "LoaderCircle" : "CircleCheck"
                    }
                    size={17}
                  />
                  <span>{run.at}</span>
                  <span className="spacer" />
                  <span>{run.status}</span>
                  <Icon name="ArrowUpRight" size={16} />
                </button>
              ))
            ) : (
              <div className="empty-state">尚无运行记录</div>
            )}
          </section>
        )}
        <h3 className="section-title">从模板开始</h3>
        <div className="template-list">
          {[
            [
              "GitPullRequest",
              "每日 PR 摘要",
              "整理当前项目的代码变更与审查记录。",
            ],
            ["ScanSearch", "定期问题巡检", "定位项目中待处理的错误和风险。"],
            ["FileText", "生成项目周报", "归纳本周完成事项和下一步安排。"],
          ].map(([icon, name, prompt]) => (
            <button
              key={name}
              onClick={() =>
                setEditing({
                  id: crypto.randomUUID(),
                  name,
                  prompt,
                  projectId: state.activeProject,
                  schedule: "工作日 09:00",
                  active: true,
                  runs: [],
                })
              }
            >
              <Icon name={icon} size={21} />
              <strong>{name}</strong>
              <Icon name="Plus" size={16} />
            </button>
          ))}
        </div>
      </div>
      {editing !== undefined && (
        <AutomationEditor
          item={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="删除自动化？"
          onClose={() => setDeleting("")}
          onConfirm={() =>
            dispatch({ type: "DELETE_AUTOMATION", id: deleting })
          }
        >
          运行记录仍保留在会话历史中。
        </ConfirmDialog>
      )}
    </div>
  );
}
