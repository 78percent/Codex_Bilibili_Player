import { useEffect, useMemo, useRef, useState } from "react";
import { useApp, useThread, useNotify } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/Button";
import { Menu } from "../../components/ui/Menu";
import { stats } from "./diff";
import { DiffFileSection } from "./DiffFileSection";

type DiffViewProps = { expanded?: boolean };

export function DiffView({ expanded = false }: DiffViewProps) {
  const { state } = useApp();
  return <ThreadDiffView key={state.activeThread} expanded={expanded} />;
}

function ThreadDiffView({ expanded }: DiffViewProps) {
  const { state, dispatch } = useApp();
  const thread = useThread();
  const notify = useNotify();
  const [filter, setFilter] = useState("all");
  const [openPaths, setOpenPaths] = useState<Set<string>>(() => new Set());
  const [wrap, setWrap] = useState(false);
  const [commentLine, setCommentLine] = useState("");
  const [revealPath, setRevealPath] = useState("");
  const sections = useRef(new Map<string, HTMLElement>());
  const mode = state.settings.diffLayout === "并排" ? "split" : "unified";
  const comments: Record<string, string> =
    state.settings["comments:" + state.activeThread] || {};
  const files = useMemo(
    () => (thread?.files || []).filter(
      (file) => filter === "all" || (filter === "staged" ? file.staged : !file.staged),
    ),
    [thread?.files, filter],
  );
  const total = useMemo(() => stats(files), [files]);
  const allExpanded = files.length > 0 && files.every((file) => openPaths.has(file.path));

  useEffect(() => {
    const path = state.selectedFile;
    if (!path || (state.panelTab !== "diff" && state.page !== "review")) return;
    if (!thread?.files.some((file) => file.path === path)) return;
    setFilter("all");
    setOpenPaths((current) => new Set(current).add(path));
    setRevealPath(path);
    // Consume the request so clicking the same chat-card file can reveal it again.
    dispatch({ type: "SET", value: { selectedFile: "" } });
  }, [state.selectedFile, state.panelTab, state.page, thread?.files, dispatch]);

  useEffect(() => {
    if (!revealPath || !openPaths.has(revealPath)) return;
    const section = sections.current.get(revealPath);
    if (!section) return;
    section.scrollIntoView({ block: "nearest", inline: "nearest" });
    setRevealPath("");
  }, [revealPath, openPaths]);

  const toggleFile = (path: string) => setOpenPaths((current) => {
    const next = new Set(current);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    return next;
  });
  const expandAll = () => setOpenPaths((current) =>
    new Set([...current, ...files.map((file) => file.path)]),
  );
  const collapseAll = () => setOpenPaths(new Set());
  const stageFile = (path: string) => {
    if (!thread) return;
    dispatch({
      type: "UPDATE_THREAD",
      id: thread.id,
      patch: { files: thread.files.map((file) =>
        file.path === path ? { ...file, staged: !file.staged } : file,
      ) },
    });
  };
  const stageVisible = (staged: boolean) => {
    if (!thread) return;
    const visible = new Set(files.map((file) => file.path));
    dispatch({
      type: "UPDATE_THREAD",
      id: thread.id,
      patch: { files: thread.files.map((file) =>
        visible.has(file.path) ? { ...file, staged } : file,
      ) },
    });
  };
  const openEditor = (path: string) => dispatch({
    type: "SET",
    value: {
      page: "thread",
      panelOpen: true,
      panelTab: "file",
      selectedFile: path,
      tabs: [...new Set([...state.tabs, "file"])],
    },
  });

  return (
    <div className={`diff-view diff-accordion ${expanded ? "expanded" : ""} ${wrap ? "wrap-lines" : ""}`}>
      <div className="diff-toolbar">
        <div className="diff-range-pill">
          <span className="diff-range-select">
            <select aria-label="差异范围" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">上一轮</option>
              <option value="unstaged">未暂存</option>
              <option value="staged">已暂存</option>
            </select>
            <Icon name="ChevronDown" size={12} />
          </span>
          <span className="diff-stat"><b>+{total.added}</b><em>-{total.removed}</em></span>
        </div>
        <div className="spacer" />
        <div className="diff-tool-pill">
          <Menu
            align="right"
            trigger={<IconButton icon="Ellipsis" label="更多变更操作" />}
            items={[
              { label: "暂存当前列表", icon: "Plus", disabled: !files.some((file) => !file.staged), action: () => stageVisible(true) },
              { label: "取消当前列表暂存", icon: "Minus", disabled: !files.some((file) => file.staged), action: () => stageVisible(false) },
            ]}
          />
          <IconButton icon="FoldVertical" label="折叠全部文件" disabled={!openPaths.size} onClick={collapseAll} />
          <IconButton icon="UnfoldVertical" label="展开全部文件" disabled={!files.length || allExpanded} onClick={expandAll} />
          <IconButton icon="WrapText" label="代码自动换行" aria-pressed={wrap} onClick={() => setWrap(!wrap)} />
          <IconButton
            icon={mode === "unified" ? "Columns2" : "Rows3"}
            label={mode === "unified" ? "切换为并排差异" : "切换为统一差异"}
            aria-pressed={mode === "split"}
            onClick={() => dispatch({ type: "SETTINGS", value: { diffLayout: mode === "unified" ? "并排" : "统一" } })}
          />
        </div>
      </div>
      <div className="diff-body">
        {files.length ? files.map((file) => (
          <DiffFileSection
            key={file.path}
            file={file}
            open={openPaths.has(file.path)}
            mode={mode}
            comments={comments}
            commentLine={commentLine}
            register={(element) => {
              if (element) sections.current.set(file.path, element);
              else sections.current.delete(file.path);
            }}
            onToggle={() => toggleFile(file.path)}
            onStage={() => stageFile(file.path)}
            onOpenEditor={() => openEditor(file.path)}
            onCommentLine={setCommentLine}
            onCommentChange={(line, value) => dispatch({
              type: "SETTINGS",
              value: { ["comments:" + state.activeThread]: { ...comments, [line]: value } },
            })}
            onSaveComment={() => {
              notify("评论已保存到当前审查");
              setCommentLine("");
            }}
          />
        )) : (
          <div className="empty-state">
            <Icon name="GitCompareArrows" size={30} />
            <p>没有文件更改</p>
          </div>
        )}
      </div>
    </div>
  );
}
