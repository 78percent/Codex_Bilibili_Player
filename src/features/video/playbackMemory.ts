import { useEffect, type MutableRefObject } from 'react';
import type { VideoInfo } from './VideoProvider';

export type SavedPlayback = { bvid: string; cid: number; time: number; thread: string | null };
const key = (uid: string) => `bilibili-last-playback-v1:${uid}`;
export function readPlayback(uid: string): SavedPlayback | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key(uid)) || 'null');
    if (!saved || !/^BV[0-9A-Za-z]{10}$/.test(saved.bvid) || !Number.isSafeInteger(saved.cid) || saved.cid <= 0) return null;
    return { bvid: saved.bvid, cid: saved.cid, time: Number.isFinite(saved.time) ? Math.max(0, saved.time) : 0, thread: typeof saved.thread === 'string' ? saved.thread : null };
  } catch { return null; }
}

export function usePlaybackMemory(video: VideoInfo | null, uid: string, thread: string | null, media: HTMLVideoElement, pendingTime: MutableRefObject<number>) {
  useEffect(() => {
    if (!video || !uid) return;
    let stopped = false, lastSaved = 0;
    const save = () => {
      if (stopped) return;
      const time = pendingTime.current || media.currentTime || 0;
      try { localStorage.setItem(key(uid), JSON.stringify({ bvid: video.bvid, cid: video.cid, time, thread })); }
      catch { /* Storage failure must not interrupt playback. */ }
      lastSaved = Date.now();
    };
    const tick = () => { if (Date.now() - lastSaved >= 2000) save(); };
    const beforeReset = () => { save(); stopped = true; };
    save();
    media.addEventListener('timeupdate', tick); media.addEventListener('pause', save);
    media.addEventListener('bilibili-before-reset', beforeReset); window.addEventListener('beforeunload', save);
    return () => {
      media.removeEventListener('timeupdate', tick); media.removeEventListener('pause', save);
      media.removeEventListener('bilibili-before-reset', beforeReset); window.removeEventListener('beforeunload', save);
    };
  }, [video, uid, thread, media, pendingTime]);
}
