import { useLayoutEffect, useRef, useState } from "react";
import { useApp, useThread } from "../../state/store";
import { Button, IconButton } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { Menu } from "../../components/ui/Menu";
import { ComposerAttachments, useComposerAttachments } from "./ComposerAttachments";
import { ReasoningControl } from "./ReasoningControl";

export function Composer() {
  const { state, dispatch } = useApp();
  const thread = useThread();
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const { attachments, addFiles, remove, clear } = useComposerAttachments();
  const isEmpty = state.page === "home" || !thread?.messages.length;
  const run = state.page === "home" ? undefined : state.runs.find((item) => item.threadId === state.activeThread);
  const active = run && run.status !== "stopped";
  const update = (value: Record<string, unknown>) => dispatch({ type: "SETTINGS", value });
  const permission = state.settings.permission === "完全访问" ? "完全访问"
    : state.settings.permission === "只读" ? "只读" : "请求批准";

  useLayoutEffect(() => {
    const element = textarea.current;
    if (!element) return;
    const resize = () => {
      element.style.height = "0px";
      const minimum = 44;
      element.style.height = `${Math.min(192, Math.max(minimum, element.scrollHeight))}px`;
      element.style.overflowY = element.scrollHeight > 192 ? "auto" : "hidden";
    };
    resize();
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth !== width) {
        width = element.clientWidth;
        resize();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, isEmpty]);

  const send = () => {
    if (!text.trim() || run) return;
    dispatch({ type: "SEND", text: text.trim(), attachments: attachments.map((item) => item.name) });
    setText("");
    clear();
  };
  const insert = (value: string) => {
    setText((current) => current + value);
    textarea.current?.focus();
  };

  return (
    <div className="composer-zone">
      <div className="composer">
        <ComposerAttachments attachments={attachments} onRemove={remove} />
        <textarea
          ref={textarea}
          aria-label="发送消息"
          placeholder={isEmpty ? "随心输入" : "和 Codex 一起工作"}
          value={text} rows={1}
          onChange={(event) => setText(event.target.value)}
          onPaste={(event) => {
            const files = Array.from(event.clipboardData.files);
            if (!files.length) return;
            event.preventDefault();
            addFiles(files);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send();
            }
          }}
        />
        <div className="composer-controls">
          <div className="composer-left">
            <Menu trigger={<IconButton icon="Plus" label="添加" />} items={[
              { label: "添加照片和文件", icon: "Paperclip", action: () => input.current?.click() },
              { label: "提及文件", icon: "AtSign", action: () => insert(" @") },
              { label: "使用技能", icon: "Shapes", action: () => insert(" /") },
              { label: "计划模式", icon: "ListTodo", selected: state.settings.planMode, action: () => update({ planMode: !state.settings.planMode }) },
              { divider: true },
              ...["本地", "Worktree", "云端"].map((environment) => ({
                label: environment,
                icon: environment === "本地" ? "Monitor" : environment === "Worktree" ? "GitBranch" : "Cloud",
                selected: environment === state.settings.environment,
                action: () => update({ environment }),
              })),
            ]} />
            <Menu trigger={
              <button className="composer-permission" aria-label={`权限：${permission}`}>
                <Icon name="ShieldAlert" size={16} /><span>{permission}</span>
              </button>
            } items={["请求批准", "完全访问", "只读"].map((value) => ({
              label: value, selected: permission === value,
              action: () => update({ permission: value === "请求批准" ? "默认权限" : value }),
            }))} />
          </div>
          <div className="composer-right">
            {state.settings.planMode && <button className="chip composer-plan" onClick={() => update({ planMode: false })} title="关闭计划模式">计划<Icon name="X" size={11} /></button>}
            <ReasoningControl model={state.settings.model} effort={state.settings.effort} onChange={update} />
            {run?.status === "stopped" ? (
              <Button icon="Play" onClick={() => dispatch({ type: "RESUME", id: thread?.id })}>继续</Button>
            ) : (
              <button
                className={`send-button ${active ? "stop" : ""}`}
                aria-label={active ? "停止" : "发送"}
                disabled={!active && !text.trim()}
                onClick={() => active ? dispatch({ type: "STOP", id: thread?.id }) : send()}
              ><Icon name={active ? "Square" : "ArrowUp"} size={19} /></button>
            )}
          </div>
        </div>
        <input ref={input} hidden type="file" multiple onChange={(event) => {
          addFiles(Array.from(event.target.files || []));
          event.target.value = "";
        }} />
      </div>
    </div>
  );
}
