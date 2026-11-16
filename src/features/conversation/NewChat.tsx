import { useApp, useThread } from "../../state/store";
import { scenarios } from "../../scenarios";
import { Icon } from "../../components/ui/Icon";
import { Menu } from "../../components/ui/Menu";
export function NewChatHero() {
  return <div className="new-chat-hero">
    <svg viewBox="0 0 56 56" aria-hidden="true"><path d="M19 7c4-5 10-5 14-1 7-1 12 4 12 10 7 4 8 11 3 16 2 7-3 13-10 13-4 7-12 8-17 3-7 1-13-4-13-11-6-5-6-12-1-17C6 13 11 8 19 7Z" /><path d="m19 21 5 7-5 7m11 1h8" /></svg>
    <h1>我们要构建什么？</h1>
  </div>;
}
export function NewChatProject() {
  const { state, dispatch } = useApp();
  const thread = useThread();
  const project = state.projects.find(item => item.id === state.activeProject);
  return <div className="new-chat-project">
    <Menu trigger={<button><Icon name="Folder" size={15} /><span>{state.settings.newChatProjectPicked ? project?.name || "选择项目" : "选择项目"}</span></button>} items={state.projects.map(item => ({
      label: item.name, icon: "Folder", selected: item.id === state.activeProject && state.settings.newChatProjectPicked,
      action: () => {
        dispatch({ type: "SET", value: { activeProject: item.id } });
        dispatch({ type: "SETTINGS", value: { newChatProjectPicked: true } });
        if (state.page === "thread" && thread && !thread.messages.length) dispatch({ type: "UPDATE_THREAD", id: thread.id, patch: { projectId: item.id, branch: (scenarios[item.id] || scenarios.atlas).branch } });
      },
    }))} />
  </div>;
}

