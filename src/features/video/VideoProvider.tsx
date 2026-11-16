import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAccount } from '../account/AccountProvider';
import { biliRequest } from '../account/api';
import { useApp } from '../../state/store';
export type Placement = 'chat' | 'dock';
export type VideoInfo = { bvid: string; cid: number; title: string; cover: string; author: string; duration: number };
type Quality = { id: string; quality: number; label: string; codec: string; width: number; height: number };
type Playback = { manifest: string; qualities: Quality[]; initialQuality: string; duration: number };
type VideoContextValue = {
  video: VideoInfo | null; loading: boolean; preparing: boolean; error: string; playing: boolean; time: number; duration: number; volume: number;
  qualities: Quality[]; quality: string; placement: Placement; ownerThread: string | null;
  refresh: () => Promise<void>; toggle: () => Promise<void>; seek: (time: number) => void; setVolume: (value: number) => void;
  setQuality: (id: string) => void; move: (to: Placement) => void; register: (place: Placement, host: HTMLElement | null) => void;
};
const Context = createContext<VideoContextValue>(null!);
export const useVideo = () => useContext(Context);
export function VideoProvider({ children }: { children: ReactNode }) {
  const account = useAccount(), { state, dispatch } = useApp();
  const [video,setVideo] = useState<VideoInfo | null>(null), [loading,setLoading] = useState(false), [preparing,setPreparing] = useState(false), [error,setError] = useState('');
  const [playing,setPlaying] = useState(false), [time,setTime] = useState(0), [duration,setDuration] = useState(0), [volume,updateVolume] = useState(1);
  const [qualities,setQualities] = useState<Quality[]>([]), [quality,updateQuality] = useState(''), [placement,setPlacement] = useState<Placement>('chat');
  const [ownerThread,setOwnerThread] = useState<string | null>(null);
  const element = useRef<HTMLVideoElement | null>(null), engine = useRef<any>(null), hosts = useRef<Partial<Record<Placement,HTMLElement>>>({});
  const preferred = useRef<Placement>('chat'), requestId = useRef(0), preparingRef = useRef(false), selected = useRef<VideoInfo | null>(null);
  const lastUser = useRef<string | null>(null), playbackReady = useRef(false);
  const eligible = useRef(account.eligible); eligible.current = account.eligible;
  const playIntent = useRef(false), movingPlayback = useRef(false);
  const stateRef = useRef(state); stateRef.current = state;
  if (!element.current) {
    element.current = document.createElement('video'); element.current.playsInline = true; element.current.preload = 'none';
    element.current.setAttribute('aria-label','B站视频'); element.current.className = 'bili-video-element';
  }
  const reset = useCallback(() => {
    requestId.current++; preparingRef.current = false; playbackReady.current = false; playIntent.current = false; movingPlayback.current = false;
    const el = element.current!; el.pause(); engine.current?.reset(); engine.current = null;
    el.removeAttribute('src'); el.load(); el.removeAttribute('poster');
    setPreparing(false); setPlaying(false); setTime(0); setQualities([]); updateQuality('');
  },[]);
  const attach = useCallback(() => {
    const el = element.current!, host = hosts.current[preferred.current];
    if (host && el.parentElement !== host) {
      host.prepend(el);
      if (movingPlayback.current && eligible.current) void el.play().catch(() => setError('请点击播放继续观看'));
      movingPlayback.current = false;
    }
    if (!host) { playIntent.current = false; movingPlayback.current = false; el.pause(); el.remove(); }
  },[]);
  const register = useCallback((place: Placement, host: HTMLElement | null) => {
    if (host) hosts.current[place] = host; else delete hosts.current[place];
    queueMicrotask(attach);
  },[attach]);
  const refresh = useCallback(async () => {
    if (!account.eligible) return;
    reset(); const id = requestId.current;
    setLoading(true); setError(''); setVideo(null); selected.current = null;
    const current = stateRef.current;
    setOwnerThread(current.threads.find(t => t.id === current.activeThread && t.messages.length)?.id || 'desktop-demo-layout');
    try {
      const info = await biliRequest<VideoInfo>('firstVideo');
      if (requestId.current !== id) return;
      selected.current = info; setVideo(info); setDuration(info.duration); element.current!.poster = info.cover;
    } catch (e) { if (requestId.current === id) setError((e as Error).message); }
    finally { if (requestId.current === id) setLoading(false); }
  },[account.eligible,reset]);
  useEffect(() => {
    const uid = account.profile?.uid || null;
    if (!account.checking && !uid) {
      lastUser.current = null; reset(); selected.current = null; setVideo(null); setDuration(0); setLoading(false); setError(''); setOwnerThread(null);
    } else if (!account.eligible) { playIntent.current = false; element.current!.pause(); }
    else if (uid !== lastUser.current) { lastUser.current = uid; void refresh(); }
  },[account.eligible,account.profile?.uid,account.checking,refresh,reset]);
  useEffect(() => {
    const el = element.current!;
    const tick = () => { setTime(el.currentTime || 0); if (Number.isFinite(el.duration)) setDuration(el.duration); };
    const play = () => setPlaying(true), pause = () => setPlaying(false);
    const fail = () => { if (selected.current && el.error) { playbackReady.current = false; setPreparing(false); preparingRef.current = false; setError('视频加载失败，请重新播放'); } };
    el.addEventListener('timeupdate',tick); el.addEventListener('durationchange',tick); el.addEventListener('play',play); el.addEventListener('pause',pause); el.addEventListener('error',fail);
    return () => { reset(); el.remove(); el.removeEventListener('timeupdate',tick); el.removeEventListener('durationchange',tick); el.removeEventListener('play',play); el.removeEventListener('pause',pause); el.removeEventListener('error',fail); };
  },[reset]);
  const toggle = async () => {
    const el = element.current!;
    if (!account.eligible || !selected.current || preparingRef.current) return;
    if (playbackReady.current && engine.current) {
      if (!el.paused) el.pause(); else { try { await el.play(); setError(''); } catch { setError('无法开始播放，请重试'); } } return;
    }
    preparingRef.current = true; playIntent.current = true; setPreparing(true); setError(''); const id = ++requestId.current;
    try {
      const source = await biliRequest<Playback>('playback');
      const { MediaPlayer } = await import('dashjs');
      if (id !== requestId.current) return;
      const supported = source.qualities.filter(q => window.MediaSource?.isTypeSupported(`video/mp4; codecs="${q.codec}"`));
      if (!supported.length) throw new Error('当前桌面环境不支持此视频编码');
      const initial = supported.find(q => q.id === source.initialQuality) || supported[0];
      setQualities(supported); updateQuality(initial.id); engine.current?.reset();
      const player = MediaPlayer().create(); engine.current = player;
      player.updateSettings({ debug: { logLevel: 0 }, streaming: { abr: { autoSwitchBitrate: { video: false, audio: false } }, retryAttempts: { MPD: 0, MediaSegment: 0, InitializationSegment: 0 }, cacheInitSegments: true } });
      player.on(MediaPlayer.events.STREAM_INITIALIZED, () => {
        if (id !== requestId.current) return;
        player.setRepresentationForTypeById('video',initial.id,true);
        playbackReady.current = true; preparingRef.current = false; setPreparing(false);
        if (playIntent.current && eligible.current && hosts.current[preferred.current]?.isConnected && el.isConnected) void el.play().catch(() => setError('请点击播放开始观看'));
      });
      player.on(MediaPlayer.events.ERROR, () => {
        if (id !== requestId.current) return;
        el.pause(); playbackReady.current = false; preparingRef.current = false; setPreparing(false); setError('播放请求失败，请重新播放');
      });
      player.initialize(el,source.manifest,false);
    } catch (e) { if (id === requestId.current) { setError((e as Error).message); preparingRef.current = false; setPreparing(false); } }
  };
  const setQuality = (id: string) => {
    if (!engine.current || !qualities.some(q => q.id === id)) return;
    try { engine.current.setRepresentationForTypeById('video',id,true); updateQuality(id); } catch { setError('画质切换失败，请重试'); }
  };
  const move = (to: Placement) => {
    movingPlayback.current = !element.current!.paused;
    preferred.current = to; setPlacement(to);
    const thread = ownerThread || stateRef.current.activeThread || 'desktop-demo-layout';
    setOwnerThread(thread); dispatch({ type: 'SELECT_THREAD', id: thread });
    if (to === 'dock') { dispatch({ type: 'SET', value: { panelOpen: true } }); dispatch({ type: 'SETTINGS', value: { videoOpen: true } }); }
    requestAnimationFrame(attach);
  };
  return <Context.Provider value={{ video, loading, preparing, error, playing, time, duration, volume, qualities, quality, placement, ownerThread,
    refresh, toggle, seek: value => { if (playbackReady.current) element.current!.currentTime = Math.max(0,Math.min(value,duration)); },
    setVolume: value => { element.current!.volume = value; updateVolume(value); }, setQuality, move, register }}>{children}</Context.Provider>;
}
