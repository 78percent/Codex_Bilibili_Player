import { useState } from "react";
import { useApp, useNotify } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { Button, IconButton } from "../../components/ui/Button";
import { Markdown } from "./Markdown";
import type { Message } from "../../state/types";
export function UserMessage({ message, threadId }: { message: Message; threadId: string }) {
  const notify = useNotify();
  const { dispatch } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  return <article className="message user">
    {message.images?.length ? <div className="user-image-strip">{message.images.map(image => <img key={image.src} src={image.src} alt={image.name} />)}</div> : null}
    <div className={`message-content ${editing ? "user-message-editor" : ""}`}>
      {editing ? <form onSubmit={event => {
        event.preventDefault();
        if (!draft.trim()) return;
        dispatch({ type: "EDIT_MESSAGE", threadId, messageId: message.id, text: draft.trim() });
        setEditing(false);
      }}>
        <textarea autoFocus aria-label="编辑消息内容" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => {
          if (event.key === "Escape") { event.stopPropagation(); setEditing(false); }
        }} />
        <footer><Button type="button" onClick={() => setEditing(false)}>取消</Button><Button variant="primary" disabled={!draft.trim()}>保存</Button></footer>
      </form> : <Markdown text={message.text} />}
      {message.attachments?.length ? <div className="attachment-chips">{message.attachments.map(name => <span key={name}><Icon name="File" size={14} />{name}</span>)}</div> : null}
    </div>
    <div className="message-actions"><span>{message.createdAt}</span><IconButton icon="Copy" label="复制消息" onClick={async () => {
      try { await navigator.clipboard.writeText(message.text); notify("已复制"); } catch { notify("无法写入剪贴板"); }
    }} /><IconButton icon="Pencil" label="编辑消息" onClick={() => { setDraft(message.text); setEditing(true); }} /></div>
  </article>;
}

