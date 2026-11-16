import { useApp } from "../state/store";
import { Icon } from "../components/ui/Icon";
import { IconButton } from "../components/ui/Button";
import { Menu } from "../components/ui/Menu";
export function DesktopBar() {
  const { state, dispatch } = useApp();
  const nav = (page: string) => dispatch({ type: "NAVIGATE", page });
  const menus = [
    { label: "文件", items: [
      { label: "新聊天", shortcut: "Ctrl N", action: () => nav("home") },
      { label: "项目", action: () => nav("project") },
      { label: "设置", shortcut: "Ctrl ,", action: () => nav("settings") },
    ] },
    { label: "编辑", items: [
      { label: "搜索聊天", shortcut: "Ctrl K", action: () => dispatch({ type: "SET", value: { searchOpen: true } }) },
      { label: "已归档", action: () => nav("archive") },
    ] },
    { label: "视图", items: [
      { label: "切换侧边栏", shortcut: "Ctrl B", action: () => dispatch({ type: "SET", value: { sidebarOpen: !state.sidebarOpen } }) },
      { label: "变更", action: () => dispatch({ type: "SET", value: { panelOpen: true, panelTab: "diff" } }) },
      { label: "视频", action: () => { dispatch({ type: "SETTINGS", value: { videoOpen: true } }); dispatch({ type: "SET", value: { panelOpen: true } }); } },
    ] },
    { label: "帮助", items: [
      { label: "关于 Codex Bilibili Player", action: () => dispatch({ type: "NAVIGATE", page: "settings", section: "about" }) },
    ] },
  ];
  return <header className="desktop-bar">
    <IconButton icon="ArrowLeft" label="返回最近聊天" onClick={() => dispatch({ type: "SELECT_THREAD", id: state.threads.find(t => !t.archived)?.id })} />
    <IconButton icon="ArrowRight" label="新聊天" onClick={() => nav("home")} />
    <IconButton icon="PanelLeft" label="切换侧边栏" onClick={() => dispatch({ type: "SET", value: { sidebarOpen: !state.sidebarOpen } })} />
    {menus.map(menu => <Menu key={menu.label} trigger={<button className="desktop-menu">{menu.label}</button>} items={menu.items} />)}
    <div className="spacer" />
    <div className="window-controls">
      {[["Minus", "最小化", "minimize"], ["Copy", "最大化", "maximize"], ["X", "关闭", "close"]].map(([icon, label, action]) =>
        <button key={action} className={action === "close" ? "close-window" : ""} aria-label={label} onClick={() => (window as any).desktop?.windowAction(action)}><Icon name={icon} size={14} /></button>
      )}
    </div>
  </header>;
}

