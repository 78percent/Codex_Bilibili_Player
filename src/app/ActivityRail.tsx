import { useApp } from "../state/store";
import { IconButton } from "../components/ui/Button";
import { Menu } from "../components/ui/Menu";
import { AccountMenu } from '../features/account/AccountMenu';
import { useVideoSearch } from '../features/video-search/VideoSearchProvider';
import { useHistory } from '../features/history/HistoryProvider';
import { Icon } from '../components/ui/Icon';
export function ActivityRail() {
  const { state, dispatch } = useApp();
  const videoSearch = useVideoSearch();
  const history = useHistory();
  const nav = (page: string) => dispatch({ type: "NAVIGATE", page });
  return <nav className="activity-rail" aria-label="功能栏">
    <div className={["home", "thread", "project"].includes(state.page) ? "rail-selected" : ""}><IconButton icon="House" label="主页" onClick={() => nav("home")} /></div>
    <button ref={node => { history.clock.current = node; }} className={`icon-button ${history.view.open && history.view.mode === 'manager' ? 'rail-selected' : ''}`} title="观看记录" aria-label="观看记录" aria-haspopup="dialog" aria-expanded={history.view.open && history.view.mode === 'manager'} data-history-trigger onClick={event => history.toggleManager(event.currentTarget)}><Icon name="Clock3" /></button>
    <div className={state.page === "work" ? "rail-selected" : ""}><IconButton icon="AtSign" label="Work" onClick={() => nav("work")} /></div>
    <button className={`icon-button rail-video-search ${videoSearch.open ? 'rail-selected' : ''}`} title="搜索B站视频" aria-label="搜索B站视频" aria-haspopup="dialog" aria-expanded={videoSearch.open} onClick={() => { history.close(); videoSearch.setOpen(true); }}>
      <span className="bilibili-brand-icon" aria-hidden="true" />
    </button>
    <Menu trigger={<IconButton icon="Ellipsis" label="更多功能" />} items={[
      { label: "自动化", icon: "Clock3", action: () => nav("automations") },
      { label: "技能", icon: "Shapes", action: () => nav("skills") },
      { label: "应用", icon: "Blocks", action: () => nav("apps") },
      { label: "代码审查", icon: "GitCompareArrows", action: () => nav("review") },
      { label: "已归档", icon: "Archive", action: () => nav("archive") },
    ]} />
    <div className="spacer" />
    <IconButton icon="CirclePlay" label="打开示例对话" onClick={() => dispatch({ type: "SELECT_THREAD", id: "desktop-demo-layout" })} />
    <IconButton icon="Settings" label="设置" onClick={() => nav("settings")} />
    <AccountMenu />
  </nav>;
}

