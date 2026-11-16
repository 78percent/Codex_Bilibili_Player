import { useEffect, useState } from "react";
import { useApp, useThread, useNotify } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { Button } from "../../components/ui/Button";
export function CodeEditor() {
  const { state, dispatch } = useApp();
  const thread = useThread();
  const file =
    thread?.files.find((f) => f.path === state.selectedFile) ||
    thread?.files[0];
  const [draft, setDraft] = useState(file?.after || "");
  const notify = useNotify();
  useEffect(
    () => setDraft(file?.after || ""),
    [file?.path, thread?.id, file?.after],
  );
  const save = () => {
    if (file) {
      dispatch({ type: "FILE_EDIT", path: file.path, text: draft });
      notify("文件已保存");
    }
  };
  if (!file)
    return (
      <div className="empty-state">
        <Icon name="FileCode2" size={28} />
        <p>没有打开的文件</p>
      </div>
    );
  return (
    <div className="editor">
      <div className="editor-toolbar">
        <select
          aria-label="选择文件"
          value={file.path}
          onChange={(e) =>
            dispatch({ type: "SET", value: { selectedFile: e.target.value } })
          }
        >
          {thread?.files.map((f) => (
            <option key={f.path}>{f.path}</option>
          ))}
        </select>
        <Button icon="Save" onClick={save} disabled={draft === file.after}>
          保存{draft !== file.after ? " •" : ""}
        </Button>
      </div>
      <div className="editor-content">
        <pre className="editor-gutter">
          {draft
            .split("\n")
            .map((_, i) => i + 1)
            .join("\n")}
        </pre>
        <textarea
          aria-label={file.path}
          spellCheck={false}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
              e.preventDefault();
              save();
            }
            if (e.key === "Tab") {
              e.preventDefault();
              const target = e.currentTarget;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              setDraft(draft.slice(0, start) + "  " + draft.slice(end));
              requestAnimationFrame(() =>
                target.setSelectionRange(start + 2, start + 2),
              );
            }
          }}
        />
      </div>
      <div className="editor-status">
        <span>
          {file.path.endsWith(".py")
            ? "Python"
            : file.path.endsWith(".md")
              ? "Markdown"
              : "TypeScript"}
        </span>
        <span>UTF-8</span>
        <span>LF</span>
      </div>
    </div>
  );
}
