import { useEffect } from "react";
import { useApp } from "../state/store";
import { Sidebar } from "../features/sidebar/Sidebar";
import { SearchDialog } from "../features/sidebar/SearchDialog";
import { Conversation } from "../features/conversation/Conversation";
import { Workspace } from "../features/workspace/Workspace";
import { ReviewPage } from "../features/review/ReviewPage";
import { AutomationsPage } from "../features/automation/AutomationsPage";
import { CatalogPage } from "../features/catalog/CatalogPage";
import { ProfilePage } from '../features/account/ProfilePage';
import { ProjectPage, ArchivePage, WorkPage } from "../features/work/WorkPages";
import { Titlebar } from "./Titlebar";
import { DesktopBar } from "./DesktopBar";
import { ActivityRail } from "./ActivityRail";
import { ResizeHandle } from "../components/ui/SplitPane";
import { ThreadResources } from "../features/conversation/ResourcePopover";
import { useVideo } from '../features/video/VideoProvider';
import { VideoSearchDialog } from '../features/video-search/VideoSearchDialog';
import { HistoryOverlay } from '../features/history/HistoryOverlay';
export default function App() {
  const { state, dispatch } = useApp();
  const player = useVideo();
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      (document.documentElement.dataset.theme =
        state.settings.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : state.settings.theme);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [state.settings.theme]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-size",
      `${state.settings.fontSize}px`,
    );
    document.documentElement.style.setProperty(
      "--code-font-size",
      `${state.settings.codeFontSize}px`,
    );
    document.documentElement.dataset.density = state.settings.density;
    document.documentElement.dataset.motion = state.settings.reducedMotion
      ? "reduced"
      : "full";
  }, [
    state.settings.fontSize,
    state.settings.codeFontSize,
    state.settings.density,
    state.settings.reducedMotion,
  ]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (["k", "n", "b"].includes(k)) e.preventDefault();
      if (k === "k") dispatch({ type: "SET", value: { searchOpen: true } });
      if (k === "n")
        dispatch({ type: "NAVIGATE", page: "home" });
      if (k === "b")
        dispatch({ type: "SET", value: { sidebarOpen: !state.sidebarOpen } });
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [state.sidebarOpen]);
  const page = state.page;
  const newChat = page === "home" || (page === "thread" && !state.threads.find(t => t.id === state.activeThread)?.messages.length && player.ownerThread !== state.activeThread);
  const workspaceVisible = state.panelOpen && (newChat ? !!state.settings.homePanelOpen : ["thread", "work"].includes(page));
  let content;
  if (page === "thread" || page === "home") content = <Conversation />;
  else if (page === 'profile') content = <ProfilePage />;
  else if (page === "automations") content = <AutomationsPage />;
  else if (page === "skills" || page === "apps")
    content = <CatalogPage kind={page} />;
  else if (page === "review") content = <ReviewPage />;
  else if (page === "project") content = <ProjectPage />;
  else if (page === "archive") content = <ArchivePage />;
  else content = <WorkPage />;
  return (
    <div className="app-shell">
      <DesktopBar />
      <div className="desktop-body">
      <ActivityRail />
      <div className="desktop-surface">
      {state.sidebarOpen && (
        <>
          <Sidebar />
          <ResizeHandle
            value={state.sidebarWidth}
            max={380}
            onChange={(sidebarWidth: number) =>
              dispatch({ type: "SET", value: { sidebarWidth } })
            }
          />
        </>
      )}
      <div className="main-shell">
        <Titlebar />
        <div className={`main-content ${workspaceVisible ? "has-workspace" : ""} ${newChat ? "new-chat-content" : ""} ${page === "thread" && !newChat && state.settings.threadResourcesOpen && !workspaceVisible ? "has-thread-resources" : ""}`}>
          <div className="page-column">{content}</div>
          {workspaceVisible && (
            <>
              <ResizeHandle
                value={state.panelWidth}
                min={320}
                max={Math.max(360, window.innerWidth - (state.sidebarOpen ? state.sidebarWidth : 0) - 420)}
                reverse
                onChange={(panelWidth: number) =>
                  dispatch({ type: "SET", value: { panelWidth } })
                }
              />
              <Workspace />
            </>
          )}
        </div>
        {page === "thread" && !newChat && state.settings.threadResourcesOpen && <ThreadResources key={state.activeThread} />}
      </div>
      {state.searchOpen && <SearchDialog />}
      <VideoSearchDialog />
      <HistoryOverlay />
      </div>
      </div>
      {state.toast && (
        <div role="status" className="toast">
          {state.toast}
        </div>
      )}
    </div>
  );
}
