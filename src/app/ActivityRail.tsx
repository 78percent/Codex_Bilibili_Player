import { useApp } from "../state/store";
import { IconButton } from "../components/ui/Button";
import { Menu } from "../components/ui/Menu";
import { AccountMenu } from '../features/account/AccountMenu';
export function ActivityRail() {
  const { state, dispatch } = useApp();
  const nav = (page: string) => dispatch({ type: "NAVIGATE", page });
  return <nav className="activity-rail" aria-label="功能栏">
    <div className={["home", "thread", "project"].includes(state.page) ? "rail-selected" : ""}><IconButton icon="House" label="主页" onClick={() => nav("home")} /></div>
    <div className={state.page === "automations" ? "rail-selected" : ""}><IconButton icon="Clock3" label="自动化" onClick={() => nav("automations")} /></div>
    <div className={state.page === "work" ? "rail-selected" : ""}><IconButton icon="AtSign" label="Work" onClick={() => nav("work")} /></div>
    <Menu trigger={<IconButton icon="Ellipsis" label="更多功能" />} items={[
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

