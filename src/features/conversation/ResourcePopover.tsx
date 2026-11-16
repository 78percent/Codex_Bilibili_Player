import { useEffect, useRef, useState } from "react";
import { useApp, useThread } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/Button";
import { Menu } from "../../components/ui/Menu";
import { Dialog } from "../../components/ui/Dialog";
import { outputPanels, threadSources, type ThreadSource } from "./resourceData";
import { SubagentSummary } from "./SubagentSummary";
import { demoSubagents } from "../../scenarios/subagents";

export function ThreadResources() {
  const { state, dispatch } = useApp();
  const thread = useThread();
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<ThreadSource | null>(null);
  const files = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || selected || !panel.current?.contains(document.activeElement)) return;
      dispatch({ type: "SETTINGS", value: { threadResourcesOpen: false } });
      document.querySelector<HTMLButtonElement>('[aria-controls="thread-resources"]')?.focus();
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [selected, dispatch]);
  if (!thread) return null;
  const sources = threadSources(thread);
  const outputs = new Set([...(thread.files.length ? ["diff"] : []), ...(thread.outputPanels || [])]);
  const openOutput = (id: string) => dispatch({ type: "SET", value: {
    panelOpen: true, panelTab: id, tabs: [...new Set([...state.tabs, id])],
  } });
  return <>
    <aside ref={panel} id="thread-resources" className="thread-resources" aria-label="输出内容和来源">
      <section>
        <header><span>输出内容</span><Menu align="right" trigger={<IconButton icon="Plus" label="添加输出内容" />} items={outputPanels.map(item => ({
          label: item.label, icon: item.icon, selected: outputs.has(item.id),
          action: () => dispatch({ type: "UPDATE_THREAD", id: thread.id, patch: { outputPanels: [...new Set([...(thread.outputPanels || []), item.id])] } }),
        }))} /></header>
        {outputPanels.filter(item => outputs.has(item.id)).map(item => <button className="resource-row" key={item.id} onClick={() => openOutput(item.id)}>
          <Icon name={item.icon} size={16} /><span>{item.id === "diff" ? `已编辑 ${thread.files.length} 个文件` : item.label}</span>
        </button>)}
        {!outputs.size && <p className="resource-empty">暂无输出</p>}
      </section>
      <SubagentSummary agents={thread.subagents ?? demoSubagents[thread.id] ?? []} />
      <section>
        <header><span>来源</span><IconButton icon="Plus" label="添加来源文件" onClick={() => files.current?.click()} /></header>
        {(expanded ? sources : sources.slice(0, 3)).map(source => <button key={source.id} className="resource-row source-row" title={source.name}
          disabled={!source.image && !source.url && source.content === undefined} onClick={() => setSelected(source)}>
          {source.image ? <img src={source.image} alt="" /> : <Icon name={source.url ? "Globe" : "FileText"} size={16} />}
          <span>{source.name}</span>
        </button>)}
        {!sources.length && <p className="resource-empty">暂无来源</p>}
        {sources.length > 3 && <button className="resource-row resource-more" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
          <Icon name={expanded ? "ChevronUp" : "Link"} size={16} /><span>{expanded ? "收起" : "查看全部"}</span>
        </button>}
      </section>
      <input hidden ref={files} type="file" multiple onChange={event => {
        const names = Array.from(event.target.files || [], file => file.name);
        dispatch({ type: "UPDATE_THREAD", id: thread.id, patch: { referenceFiles: [...new Set([...(thread.referenceFiles || []), ...names])] } });
        event.target.value = "";
      }} />
    </aside>
    {selected && <Dialog title={selected.name} onClose={() => setSelected(null)} wide>
      <div className="resource-preview">
        {selected.image && <img src={selected.image} alt={selected.name} />}
        {selected.url && <a href={selected.url} target="_blank" rel="noreferrer">{selected.url}<Icon name="ArrowUpRight" size={15} /></a>}
        {selected.content !== undefined && <pre>{selected.content}</pre>}
      </div>
    </Dialog>}
  </>;
}
