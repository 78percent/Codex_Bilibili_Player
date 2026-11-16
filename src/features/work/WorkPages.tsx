import { useState } from "react";
import { useApp } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { Button } from "../../components/ui/Button";
import { ThreadRow } from "../sidebar/ThreadRow";
export function ProjectPage() {
  const { state, dispatch } = useApp();
  const project =
    state.projects.find((p) => p.id === state.activeProject) ||
    state.projects[0];
  return (
    <div className="page-scroll">
      <div className="page-container">
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              <Icon name="Folder" size={15} />
              项目
            </span>
            <h1>{project?.name || "项目"}</h1>
            <p>{project?.path}</p>
          </div>
          <Button
            variant="primary"
            icon="Plus"
            onClick={() =>
              dispatch({ type: "NEW_THREAD", projectId: project?.id })
            }
          >
            新任务
          </Button>
        </div>
        <div className="project-tabs">
          {state.projects.map((p) => (
            <button
              className={p.id === project?.id ? "selected" : ""}
              key={p.id}
              onClick={() =>
                dispatch({ type: "SET", value: { activeProject: p.id } })
              }
            >
              <Icon name="Folder" size={14} />
              {p.name}
            </button>
          ))}
        </div>
        <div className="project-summary">
          <Icon name="Code2" size={22} />
          <div>
            <strong>{project?.stack}</strong>
            <p>{project?.description}</p>
          </div>
          <span className="spacer" />
          <span className="chip">本地</span>
        </div>
        <h3>任务</h3>
        <div className="task-table">
          {state.threads
            .filter((t) => t.projectId === project?.id && !t.archived)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => dispatch({ type: "SELECT_THREAD", id: t.id })}
              >
                <Icon
                  name={
                    t.status === "running" ? "LoaderCircle" : "MessageSquare"
                  }
                  size={18}
                />
                <span>
                  {t.title}
                  <small>{t.branch}</small>
                </span>
                <span className="status-pill">
                  {t.status === "complete"
                    ? "已完成"
                    : t.status === "running"
                      ? "运行中"
                      : "待处理"}
                </span>
                <span>{new Date(t.updatedAt).toLocaleDateString("zh-CN")}</span>
                <Icon name="ChevronRight" size={15} />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
export function ArchivePage() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState("");
  const items = state.threads.filter(
    (t) => t.archived && t.title.includes(query),
  );
  return (
    <div className="page-scroll">
      <div className="page-container">
        <div className="page-heading">
          <h1>已归档</h1>
          <input
            placeholder="搜索已归档任务"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {items.length ? (
          items.map((t) => (
            <div className="archive-row" key={t.id}>
              <ThreadRow thread={t} />
              <Button
                onClick={() =>
                  dispatch({
                    type: "UPDATE_THREAD",
                    id: t.id,
                    patch: { archived: false },
                  })
                }
              >
                恢复
              </Button>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Icon name="Archive" size={32} />
            <p>暂无归档任务</p>
          </div>
        )}
      </div>
    </div>
  );
}
export function WorkPage() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState("全部");
  const kinds = ["全部", "文档", "代码", "网站"];
  return (
    <div className="page-scroll">
      <div className="page-container">
        <div className="page-heading">
          <h1>Work</h1>
          <Button
            icon="SquarePen"
            onClick={() =>
              dispatch({
                type: "SET",
                value: { page: "home", activeThread: "" },
              })
            }
          >
            新建
          </Button>
        </div>
        <div className="project-tabs">
          {kinds.map((k) => (
            <button
              key={k}
              className={filter === k ? "selected" : ""}
              onClick={() => setFilter(k)}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="work-grid">
          {state.projects
            .flatMap((p) => [
              {
                project: p,
                title: `${p.name} · 变更报告`,
                kind: "文档",
                icon: "FileText",
                tab: "document",
              },
              {
                project: p,
                title: `${p.name} · 文件审查`,
                kind: "代码",
                icon: "FileCode2",
                tab: "diff",
              },
              {
                project: p,
                title: `${p.name} · 界面预览`,
                kind: "网站",
                icon: "Globe",
                tab: "browser",
              },
            ])
            .filter((x) => filter === "全部" || x.kind === filter)
            .map((item, i) => (
              <button
                key={i}
                className="work-card"
                onClick={() => {
                  const t = state.threads.find(
                    (t) => t.projectId === item.project.id,
                  );
                  if (t) dispatch({ type: "SELECT_THREAD", id: t.id });
                  else
                    dispatch({
                      type: "SET",
                      value: {
                        activeThread: "",
                        activeProject: item.project.id,
                      },
                    });
                  dispatch({
                    type: "SET",
                    value: {
                      page: "work",
                      panelOpen: true,
                      panelTab: item.tab,
                    },
                  });
                }}
              >
                <div
                  className={`work-thumbnail ${item.kind === "代码" ? "code-thumbnail" : ""}`}
                >
                  <Icon name={item.icon} size={30} />
                  {item.kind === "代码" && (
                    <pre>
                      export function workspace() {"{"}
                      <br /> return resolveContext();
                      <br />
                      {"}"}
                    </pre>
                  )}
                </div>
                <strong>{item.title}</strong>
                <small>{item.project.name} · 今天</small>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
