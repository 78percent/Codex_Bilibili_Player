import { useEffect, useState } from "react";
import { formatDuration, runElapsed } from "../../scenarios/pacing";
import { useApp, useNotify } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/Button";
import { Menu } from "../../components/ui/Menu";
import { Markdown } from "./Markdown";
import { ToolBlock } from "./ToolBlock";
import { ChangeSummary } from "./ChangeSummary";
import type { Message, Thread } from "../../state/types";

function ProcessMessage({ message, threadId }: { message: Message; threadId: string }) {
  const tools = message.tools || [];
  return <div className="process-message">
    {message.text && <Markdown text={message.text} />}
    {!message.text && tools.filter(tool => tool.kind === "thinking").map(tool => <Markdown key={tool.id} text={tool.output} />)}
    {message.plan && <details className="process-plan"><summary><Icon name="ListTodo" size={15} />更新了计划</summary><ol>{message.plan.map(step => <li key={step}>{step}</li>)}</ol></details>}
    <div className="process-tools">{tools.filter(tool => tool.kind !== "thinking").map(tool => <ToolBlock key={tool.id} tool={tool} threadId={threadId} />)}</div>
  </div>;
}

export function AssistantTurn({ messages, thread, active }: { messages: Message[]; thread: Thread; active: boolean }) {
  const { state, dispatch } = useApp();
  const notify = useNotify();
  const run = active ? state.runs.find(item => item.threadId === thread.id) : undefined;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (run?.status !== "running") return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [run?.runId, run?.status]);
  const last = messages[messages.length - 1];
  const onlyProcess = active && messages.length === 1;
  const process = onlyProcess ? messages : messages.slice(0, -1);
  const key = "process:" + thread.id + ":" + messages[0].id;
  const forcedOpen = active && process.some(message => message.tools?.some(tool => tool.status === "approval"));
  const open = forcedOpen || (state.settings[key] ?? active);
  const final = onlyProcess ? null : last;
  const copy = async () => {
    try { await navigator.clipboard.writeText(final?.text || messages.map(message => message.text).join("\n\n")); notify("已复制"); }
    catch { notify("无法写入剪贴板"); }
  };
  return <article className="assistant-turn">
    {process.length > 0 && <>
      <button className="turn-duration" aria-expanded={open} onClick={() => dispatch({ type: "SETTINGS", value: { [key]: !open } })}>
        <span>{active ? thread.status === "waiting" ? "等待批准" : thread.status === "stopped" ? "已停止" : `${run?.phase || "正在思考"}${run?.startedAt ? ` · ${formatDuration(runElapsed(run, now))}` : ""}` : `用时 ${last.duration || "1 分钟 12 秒"}`}</span>
        <Icon name={open ? "ChevronDown" : "ChevronRight"} size={14} />
      </button>
      {open && <div className="turn-process">{process.map(message => <ProcessMessage key={message.id} message={message} threadId={thread.id} />)}</div>}
    </>}
    {final && <div className="turn-final">
      <Markdown text={final.text} />
      {final.tools?.map(tool => <ToolBlock key={tool.id} tool={tool} threadId={thread.id} />)}
      {final.changes && <ChangeSummary files={thread.files} />}
    </div>}
    {!active && <div className="turn-actions">
      <IconButton icon="Copy" label="复制回复" onClick={copy} />
      <Menu trigger={<IconButton icon="Ellipsis" label="更多回复操作" />} items={[
        { label: "复制回复", icon: "Copy", action: copy },
        { label: "查看变更", icon: "FileDiff", action: () => dispatch({ type: "SET", value: { panelOpen: true, panelTab: "diff" } }) },
        { label: "有帮助", icon: "ThumbsUp", action: () => notify("已记录反馈") },
      ]} />
    </div>}
  </article>;
}

