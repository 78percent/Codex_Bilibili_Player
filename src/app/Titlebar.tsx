import { useApp, useThread } from "../state/store";
import { IconButton } from "../components/ui/Button";
import { Menu } from "../components/ui/Menu";
import { Icon } from "../components/ui/Icon";
const titles: Record<string, string> = {
  home: "新聊天", project: "项目", automations: "自动化", skills: "技能",
  apps: "应用", review: "代码审查", work: "Work", archive: "已归档", settings: "设置", profile: '个人资料',
};
export function Titlebar() {
  const { state, dispatch } = useApp();
  const thread = useThread();
  if (state.page === "home" || (state.page === "thread" && !thread?.messages.length)) return <header className="titlebar home-titlebar"><IconButton icon="PanelRight" label="切换工作区" onClick={() => { dispatch({ type: "SETTINGS", value: { homePanelOpen: !state.settings.homePanelOpen } }); dispatch({ type: "SET", value: { panelOpen: true } }); }} /></header>;
  const open = (panelTab: string) => dispatch({ type: "SET", value: { panelOpen: true, panelTab } });
  return <header className={`titlebar ${state.page === "thread" ? "chat-titlebar" : ""}`}>
    <div className="titlebar-left">
      {state.page === "thread" ? <Menu trigger={<button className="thread-title-menu" aria-label="聊天菜单"><Icon name="Folder" size={17} /><span className="window-title">{thread?.title}</span><Icon name="ChevronDown" size={13} /></button>} items={[
        { label: "查看变更", icon: "GitCompareArrows", action: () => open("diff") },
        { label: "文件", icon: "FileCode2", action: () => open("file") },
        { label: "终端", icon: "Terminal", action: () => open("terminal") },
        { label: "浏览器", icon: "Globe", action: () => open("browser") },
        { label: "归档聊天", icon: "Archive", disabled: !thread, action: () => { dispatch({ type: "UPDATE_THREAD", id: thread?.id, patch: { archived: true } }); dispatch({ type: "NAVIGATE", page: "home" }); } },
      ]} /> : <span className="window-title">{titles[state.page]}</span>}
    </div>
    <div className="titlebar-actions">
      {state.page === "thread" && <IconButton icon="ListTree" label="输出内容和来源" aria-expanded={!!state.settings.threadResourcesOpen} aria-controls="thread-resources" className={`icon-button ${state.settings.threadResourcesOpen ? "is-active" : ""}`} onClick={() => dispatch({ type: "SETTINGS", value: { threadResourcesOpen: !state.settings.threadResourcesOpen } })} />}
      <IconButton icon="PanelRight" label={state.panelOpen ? "收起右侧栏" : "展开右侧栏"} aria-pressed={state.panelOpen} onClick={() => dispatch({ type: "SET", value: { panelOpen: !state.panelOpen } })} />
    </div>
  </header>;
}

