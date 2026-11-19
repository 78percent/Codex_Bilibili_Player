import { type PointerEvent } from 'react';
import { useApp } from '../../state/store';
import { IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useVideo } from './VideoProvider';
import { useAccount } from '../account/AccountProvider';
import { VideoSurface } from './VideoSurface';
export function ChatVideoCard() {
  const player = useVideo(), account = useAccount();
  const { state, dispatch } = useApp();
  const title = player.video ? player.video.parts.length > 1 ? `${player.video.title} · ${player.video.partTitle}` : player.video.title : '哔哩哔哩';
  const width = state.settings.videoCardWidth || 520;
  const setWidth = (value: number) => dispatch({ type: 'SETTINGS', value: { videoCardWidth: value } });
  function resize(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault(); const handle = event.currentTarget, card = handle.closest<HTMLElement>('.bili-chat-card')!;
    const startX = event.clientX, startY = event.clientY, startWidth = card.getBoundingClientRect().width;
    const maximum = card.parentElement!.getBoundingClientRect().width;
    handle.setPointerCapture(event.pointerId);
    const move = (e: globalThis.PointerEvent) => {
      const dx = e.clientX-startX, dy = (e.clientY-startY)*16/9;
      setWidth(Math.min(maximum,Math.max(260,startWidth + (Math.abs(dx) >= Math.abs(dy) ? dx : dy))));
    };
    const end = () => { handle.removeEventListener('pointermove',move); handle.removeEventListener('pointerup',end); handle.removeEventListener('pointercancel',end); handle.removeEventListener('lostpointercapture',end); };
    handle.addEventListener('pointermove',move); handle.addEventListener('pointerup',end); handle.addEventListener('pointercancel',end); handle.addEventListener('lostpointercapture',end);
  }
  return <article className="bili-chat-card" style={{ width }} aria-label="聊天中的B站视频">
    <header><Icon name="Clapperboard" size={16} /><span title={title}>{title}</span><IconButton icon="RefreshCw" label="刷新首页视频" disabled={!account.eligible || player.loading} onClick={() => void player.refresh()} /><IconButton icon="PanelRight" label="在右侧播放" onClick={() => player.move('dock')} /></header>
    <VideoSurface place="chat" />
    <footer><span title={player.video?.bvid}>{player.video ? `${player.video.author} · ${player.video.bvid}` : '视频'}</span><button className="bili-resize" aria-label="拖动调整视频大小" title="拖动调整视频大小" onPointerDown={resize} onKeyDown={e => { if (['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); setWidth(Math.max(260,width+(e.key === 'ArrowRight' ? 24 : -24))); } }}><Icon name="Grip" size={16} /></button></footer>
  </article>;
}
