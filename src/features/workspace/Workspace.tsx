import { useApp, useThread, useNotify } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { Button, IconButton } from "../../components/ui/Button";
import { Menu } from "../../components/ui/Menu";
import { DiffView } from "../review/DiffView";
import { CodeEditor } from "./CodeEditor";
import { Terminal } from "./Terminal";
import { BrowserPreview, DocumentPreview } from "./Preview";
import { VideoDock } from "../video/VideoDock";
const tabs = [
  ["diff", "FileDiff", "变更"],
  ["file", "FileCode2", "文件"],
  ["terminal", "Terminal", "终端"],
  ["browser", "Globe", "浏览器"],
  ["document", "FileText", "文档"],
];
export function Workspace() {
  const { state, dispatch } = useApp();
  const thread = useThread();
  const notify = useNotify();
  const current = tabs.find((t) => t[0] === state.panelTab) || tabs[0];
  const open = (tab: string) =>
    dispatch({
      type: "SET",
      value: { panelTab: tab, tabs: [...new Set([...state.tabs, tab])] },
    });
  return (
    <aside className={`workspace ${state.settings.videoExpanded && state.settings.videoOpen !== false ? "video-focused" : ""}`} style={{ width: state.panelWidth }}>
      <header className="workspace-tabs">
        <div>
          {tabs
            .filter((t) => state.tabs.includes(t[0]) || t[0] === state.panelTab)
            .map(([id, icon, label]) => (
              <button
                key={id}
                className={id === state.panelTab ? "selected" : ""}
                onClick={() => open(id)}
              >
                <Icon name={icon} size={14} />
                {label}
                <span
                  role="button"
                  aria-label={`关闭${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = state.tabs.filter((t) => t !== id);
                    dispatch({
                      type: "SET",
                      value: {
                        tabs: next,
                        panelTab: next[0] || "diff",
                        panelOpen: next.length > 0,
                      },
                    });
                  }}
                >
                  ×
                </span>
              </button>
            ))}
        </div>
        <Menu
          align="right"
          trigger={<IconButton icon="Plus" label="添加标签" />}
          items={tabs.map(([id, icon, label]) => ({
            label,
            icon,
            action: () => open(id),
          }))}
        />
        <IconButton
          icon="X"
          label="关闭工作区"
          onClick={() => dispatch({ type: "SET", value: { panelOpen: false } })}
        />
      </header>
      <div className="workspace-content">
        {current[0] === "diff" ? (
          <DiffView />
        ) : current[0] === "file" ? (
          <CodeEditor />
        ) : current[0] === "terminal" ? (
          <Terminal />
        ) : current[0] === "browser" ? (
          <BrowserPreview />
        ) : (
          <DocumentPreview />
        )}
      </div>
      {current[0] === "diff" && (
        <footer className="workspace-footer">
          <span>
            <Icon name="GitBranch" size={13} />
            {thread?.branch || "main"}
          </span>
          <Button
            icon="GitCommitHorizontal"
            variant="secondary"
            onClick={() => {
              if (thread) {
                dispatch({
                  type: "UPDATE_THREAD",
                  id: thread.id,
                  patch: {
                    committed: true,
                    files: thread.files.map((f) => ({ ...f, staged: true })),
                  },
                });
                notify("更改已记录为本地提交");
              }
            }}
          >
            提交
          </Button>
        </footer>
      )}
      <VideoDock />
    </aside>
  );
}
