import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/ui/Icon';
import { useVideo } from './VideoProvider';

const stamp = (value: number) => `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;

export function PlayerParts({ anchor, id, onClose }: { anchor: HTMLButtonElement; id: string; onClose: () => void }) {
  const player = useVideo(), root = useRef<HTMLDivElement>(null);
  const [position] = useState(() => {
    const rect = anchor.getBoundingClientRect(), surface = anchor.closest('.bili-player-surface')!.getBoundingClientRect();
    const width = Math.min(316, surface.width - 20, window.innerWidth - 16);
    const above = rect.top - 16, below = window.innerHeight - rect.bottom - 16;
    const placeAbove = above >= 150 || above >= below;
    return {
      left: Math.max(8, Math.min(surface.right - width - 10, window.innerWidth - width - 8)), width,
      maxHeight: Math.min(326, Math.max(118, surface.height - 70), Math.max(80, placeAbove ? above : below)),
      ...(placeAbove ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
    };
  });
  useEffect(() => {
    const selected = root.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    selected?.focus({ preventScroll: true }); selected?.scrollIntoView({ block: 'nearest' });
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node) && !anchor.contains(event.target as Node)) onClose();
    };
    const close = () => onClose();
    const scroll = (event: Event) => { if (!(event.target instanceof Node) || !root.current?.contains(event.target)) onClose(); };
    document.addEventListener('pointerdown', outside); window.addEventListener('resize', close); window.addEventListener('scroll', scroll, true);
    const surface = anchor.closest('.bili-player-surface');
    let initialized = false;
    // ResizeObserver's first notification only describes the existing anchor size.
    const resizeObserver = new ResizeObserver(() => { if (initialized) onClose(); initialized = true; });
    if (surface) resizeObserver.observe(surface);
    return () => { resizeObserver.disconnect(); document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', close); window.removeEventListener('scroll', scroll, true); };
  }, []);
  function dismiss() { onClose(); if (anchor.isConnected) anchor.focus({ preventScroll: true }); }
  const video = player.video;
  if (!video) return null;
  return createPortal(<div id={id} ref={root} className="bili-parts-panel" role="dialog" aria-label="视频选集" data-player-menu style={position}
    onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== anchor) onClose(); }}
    onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(); }
    }}>
    <header><span>选集<span className="bili-parts-count">{video.parts.length}</span></span><button type="button" aria-label="关闭选集" onClick={dismiss}><Icon name="X" size={16} /></button></header>
    <div className="bili-parts-list" role="listbox" aria-label="视频分 P" aria-busy={player.pendingPart !== null} onKeyDown={event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'));
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus({ preventScroll: true }); buttons[next]?.scrollIntoView({ block: 'nearest' });
    }}>
      {video.parts.map(part => <button key={part.cid} type="button" role="option" aria-selected={part.cid === video.cid} className="bili-part" tabIndex={part.cid === video.cid ? 0 : -1}
        title={`P${part.page} ${part.title}`} onClick={() => { dismiss(); void player.selectPart(part.cid); }}>
        <span className="bili-part-number">P{part.page}</span><span className="bili-part-title">{part.title}</span><span className="bili-part-duration">{player.pendingPart === part.cid ? '…' : stamp(part.duration)}</span>
      </button>)}
    </div>
  </div>, document.body);
}
