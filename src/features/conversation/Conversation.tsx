import { Fragment, useEffect, useRef, useState } from "react";
import { ChatVideoCard } from '../video/ChatVideoCard';
import { useVideo } from '../video/VideoProvider';
import { useApp, useThread } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { Composer } from "./Composer";
import { AssistantTurn } from "./AssistantTurn";
import { UserMessage } from "./UserMessage";
import { NewChatHero, NewChatProject } from "./NewChat";
import type { Message } from "../../state/types";

function groupMessages(messages: Message[]) {
  const groups: { role: string; messages: Message[] }[] = [];
  for (const message of messages) {
    const last = groups[groups.length - 1];
    if (message.role === "assistant" && last?.role === "assistant") last.messages.push(message);
    else groups.push({ role: message.role, messages: [message] });
  }
  return groups;
}
export function Conversation() {
  const { state } = useApp();
  const thread = useThread();
  const player = useVideo();
  const scroll = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const [showDown, setShowDown] = useState(false);
  const messages = state.page === "home" ? [] : thread?.messages || [];
  const groups = groupMessages(messages);
  const ownsVideo = state.page === 'thread' && thread?.id === player.ownerThread && !!player.video;
  const empty = !messages.length && !ownsVideo;
  useEffect(() => {
    nearBottom.current = true;
    setShowDown(false);
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight });
  }, [thread?.id, state.page]);
  useEffect(() => {
    if (nearBottom.current) scroll.current?.scrollTo({ top: scroll.current.scrollHeight });
  }, [messages]);
  useEffect(() => {
    if (ownsVideo) scroll.current?.querySelector('.bili-chat-card')?.scrollIntoView({ block: 'nearest' });
  }, [ownsVideo, player.video?.bvid]);
  return <section className={`conversation ${empty ? "empty-conversation" : ""}`}>
    <div className="message-scroll" ref={scroll} onScroll={e => {
      const el = e.currentTarget;
      nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowDown(!nearBottom.current);
    }}>
      {empty ? <NewChatHero /> : <div className="messages">
        {!messages.length && ownsVideo && <ChatVideoCard />}
        {groups.map((group, i) => <Fragment key={group.messages[0].id}>
          {group.role === "user" ? <UserMessage message={group.messages[0]} threadId={thread!.id} />
          : thread && <AssistantTurn messages={group.messages} thread={thread} active={i === groups.length - 1 && state.runs.some(run => run.threadId === thread.id)} />}
          {i === Math.min(1,groups.length-1) && (thread?.id === player.ownerThread || (!player.ownerThread && thread?.id.startsWith('desktop-demo-'))) && <ChatVideoCard />}
        </Fragment>)}
      </div>}
    </div>
    {showDown && !empty && <button className="scroll-bottom" aria-label="滚动到底部" onClick={() => { nearBottom.current = true; scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: state.settings.reducedMotion ? "instant" : "smooth" }); }}><Icon name="ArrowDown" size={19} /></button>}
    <div className={empty ? "new-chat-input" : "chat-input"}>
      {empty && <NewChatProject />}
      <Composer />
    </div>
  </section>;
}

