import { useState } from "react";
import { useApp } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/Button";
import { Menu } from "../../components/ui/Menu";
import { ProjectDialogs } from "./ProjectDialogs";
import { ThreadRow } from "./ThreadRow";
export function Sidebar() {
  const { state, dispatch } = useApp();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [dialog, setDialog] = useState<any>(null);
  const visible = [...state.threads].filter(t => !t.archived).sort((a, b) => b.updatedAt - a.updatedAt);
  const nav = (page: string) => dispatch({ type: "NAVIGATE", page });
  return <aside className="sidebar" style={{ width: state.sidebarWidth }}>
    <div className="sidebar-brand">
      <Menu trigger={<button className="brand-button">Codex<Icon name="ChevronDown" size={12} /></button>} items={[
        { label: "Codex", selected: state.page !== "work", action: () => nav("home") },
        { label: "Work", selected: state.page === "work", action: () => nav("work") },
        { divider: true },
        { label: "外观", icon: "Palette", action: () => dispatch({ type: "NAVIGATE", page: "settings", section: "appearance" }) },
      ]} />
      <div className="sidebar-header-actions">
        <IconButton icon="Bell" label="未读聊天" onClick={() => dispatch({ type: "SELECT_THREAD", id: visible.find(t => t.unread)?.id || visible[0]?.id })} />
        <IconButton icon="Search" label="搜索聊天" onClick={() => dispatch({ type: "SET", value: { searchOpen: true } })} />
      </div>
    </div>
    <nav className="sidebar-nav"><button onClick={() => nav("home")}><Icon name="SquarePen" />新聊天<kbd>Ctrl N</kbd></button></nav>
    <div className="sidebar-scroll">
      <div className="section-heading projects-heading"><span>项目</span><IconButton icon="Plus" label="添加项目" onClick={() => setDialog({ type: "new" })} /></div>
      {state.projects.map(project => <section className="project-group" key={project.id}>
        <div className="project-row">
          <button onClick={() => setExpanded(expanded.includes(project.id) ? expanded.filter(id => id !== project.id) : [...expanded, project.id])}>
            <Icon name={expanded.includes(project.id) ? "ChevronDown" : "ChevronRight"} size={13} /><Icon name="Folder" size={15} /><span>{project.name}</span>
          </button>
          <Menu align="right" trigger={<IconButton icon="Ellipsis" label={project.name + " 菜单"} />} items={[
            { label: "打开项目", icon: "FolderOpen", action: () => dispatch({ type: "SET", value: { page: "project", activeProject: project.id } }) },
            { label: "新聊天", icon: "SquarePen", action: () => dispatch({ type: "NEW_THREAD", projectId: project.id }) },
            { label: "重命名", icon: "Pencil", action: () => setDialog({ type: "rename", project }) },
            { label: "移除项目", icon: "Trash2", danger: true, action: () => setDialog({ type: "delete", project }) },
          ]} />
        </div>
        {expanded.includes(project.id) && visible.filter(t => t.projectId === project.id).map(thread => <ThreadRow key={thread.id} thread={thread} />)}
      </section>)}
      {visible.some(t => t.pinned) && <><div className="section-heading"><span>置顶</span></div>{visible.filter(t => t.pinned).map(thread => <ThreadRow key={thread.id} thread={thread} />)}</>}
      <div className="section-heading recent-heading"><span>最近</span></div>
      {visible.filter(t => !t.pinned).map(thread => <ThreadRow key={thread.id} thread={thread} />)}
    </div>
    <ProjectDialogs dialog={dialog} onClose={() => setDialog(null)} />
  </aside>;
}

