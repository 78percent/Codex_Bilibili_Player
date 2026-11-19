import { useCallback, useEffect, useRef, useState } from 'react';
import { useVideo, type Placement } from './VideoProvider';
import { useAccount } from '../account/AccountProvider';
import { useApp } from '../../state/store';
import { Icon } from '../../components/ui/Icon';
import { VideoControls } from './VideoControls';
import { VideoOverlays } from './VideoOverlays';
import { usePlayerShortcuts } from './usePlayerShortcuts';
import '../../styles/player-controls.css';
export function VideoSurface({ place }: { place: Placement }) {
  const player = useVideo(), account = useAccount(), { dispatch } = useApp();
  const active = player.placement === place;
  const busy = account.checking || player.loading || player.preparing;
  const surface = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null), latest = useRef(player); latest.current = player;
  const [notice, setNotice] = useState(''), noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = useCallback((message: string) => { setNotice(message); if (noticeTimer.current) clearTimeout(noticeTimer.current); noticeTimer.current = setTimeout(() => setNotice(''), 900); }, []);
  const shortcuts = usePlayerShortcuts(surface, active && account.eligible && !!player.video, flash);
  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);
  useEffect(() => {
    if (!active || !stage.current) return;
    const node = stage.current; let delta = 0, last = 0;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
      event.preventDefault(); const now = performance.now(); if (now - last > 250) delta = 0; last = now;
      delta += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      const steps = Math.trunc(delta / 60);
      if (steps) { delta -= steps * 60; const volume = Math.max(0, Math.min(1, latest.current.getMediaElement().volume - steps * .05)); latest.current.setVolume(volume); flash(`音量 ${Math.round(volume * 100)}%`); }
    };
    node.addEventListener('wheel', wheel, { passive: false }); return () => node.removeEventListener('wheel', wheel);
  }, [active, flash]);
  const host = useCallback((node: HTMLDivElement | null) => player.register(place,node),[place,player.register]);
  const unavailable = account.checking ? '正在检查登录…' : !account.profile ? '登录哔哩哔哩' : !account.eligible ? '检查手机号绑定' : player.loading ? '正在获取视频…' : !player.video ? '获取首页视频' : '';
  function activate() {
    if (account.checking || player.loading || player.preparing) return;
    if (!account.profile) account.openLogin();
    else if (!account.eligible) dispatch({ type: 'NAVIGATE', page: 'profile' });
    else if (!active) player.move(place);
    else if (!player.video) void player.refresh();
    else void player.toggle();
  }
  return <div ref={surface} className="bili-player-surface" {...shortcuts}>
    <div ref={stage} className={`bili-stage ${active ? 'active' : 'inactive'}`} role="button" tabIndex={0} aria-busy={active && busy} aria-label={active ? player.playing ? '暂停视频' : '播放视频' : '在此处播放'}
      onClick={() => { stage.current?.focus({ preventScroll: true }); activate(); }} onKeyDown={event => {
        if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
        const key = event.key.toLowerCase(); if (![' ', 'enter'].includes(key)) return;
        event.preventDefault();
        if (!event.repeat) activate();
      }}>
      {active && <div ref={host} className="bili-video-host" />}
      {active && player.video && !player.loading && <VideoOverlays />}
      <div className={`bili-feedback ${notice ? 'visible' : ''}`} role="status">{notice}</div>
      {(!active || unavailable || !player.playing) && <div className={`bili-video-overlay ${player.video && active && !unavailable ? 'ready' : ''}`}>
        {!active && player.video?.cover && <img src={player.video.cover} referrerPolicy="no-referrer" alt="" />}
        {active && busy ? <div className="bili-loading-status" role="status"><span className="bili-loading-track" aria-hidden="true"><span /></span><span>加载中</span></div> : <>
          <button className="bili-play-button" aria-label={!active ? '在此处播放' : unavailable || '播放'} onClick={event => { event.stopPropagation(); stage.current?.focus({ preventScroll: true }); activate(); }}><Icon name={!active ? 'ArrowDownToLine' : 'Play'} size={26} /></button>
          {(unavailable || !active) && <span>{!active ? (place === 'chat' ? '移回聊天' : '移至右侧') : unavailable}</span>}
        </>}
      </div>}
    </div>
    {active && player.video && <VideoControls />}
    {active && !player.video && busy && <div className="bili-controls-placeholder" aria-hidden="true" />}
    {(player.error || account.error) && <div className="bili-video-error" role="alert">{player.error || account.error}<button onClick={() => { if (account.error) void account.refresh(); else player.retryPlayback(); }}>重试</button></div>}
  </div>;
}
