import { useEffect, useMemo, useRef, useState } from 'react';
import { biliRequest } from '../account/api';
import type { VideoInfo } from './VideoProvider';

export type SubtitleTrack = { id: string; language: string; label: string };
export type SubtitleCue = { from: number; to: number; content: string };
export type DanmakuItem = { id: string; time: number; mode: 'scroll' | 'top' | 'bottom'; color: string; content: string };
function parseDanmaku(xml: string): DanmakuItem[] {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror') || document.documentElement.nodeName !== 'i') throw new Error('弹幕格式不可用');
  if (document.querySelector('state')?.textContent === '1') throw new Error('该视频已关闭弹幕');
  return Array.from(document.querySelectorAll('d')).flatMap((node, index) => {
    const fields = (node.getAttribute('p') || '').split(','), time = Number(fields[0]), type = Number(fields[1]), color = Number(fields[3]);
    if (!Number.isFinite(time) || time < 0 || ![1, 2, 3, 4, 5].includes(type) || !node.textContent) return [];
    const rgb = Number.isInteger(color) && color >= 0 && color <= 0xffffff ? color : 0xffffff;
    return [{ id: fields[7] || String(index), time, mode: (type === 4 ? 'bottom' : type === 5 ? 'top' : 'scroll') as DanmakuItem['mode'], color: `#${rgb.toString(16).padStart(6, '0')}`, content: node.textContent }];
  }).sort((a, b) => a.time - b.time);
}
export function useVideoExtras(video: VideoInfo | null, eligible: boolean, language: string, danmakuEnabled: boolean) {
  const key = eligible && video ? `${video.bvid}:${video.cid}` : '';
  // A new selection can reuse the same CID after the main process resets its caption tracks.
  const selection = useMemo(() => key && video ? { key, video } : null, [key, video]);
  const [retry, setRetry] = useState(0);
  const [danmakuRetry, setDanmakuRetry] = useState(0);
  const commentCache = useRef<{ selection: typeof selection; items: DanmakuItem[] } | null>(null);
  const [metadata, setMetadata] = useState<{ selection: typeof selection; tracks: SubtitleTrack[]; error: string; loading: boolean }>({ selection: null, tracks: [], error: '', loading: false });
  const [text, setText] = useState<{ selection: typeof selection; key: string; cues: SubtitleCue[]; error: string; loading: boolean }>({ selection: null, key: '', cues: [], error: '', loading: false });
  const [comments, setComments] = useState<{ selection: typeof selection; items: DanmakuItem[]; error: string; loading: boolean }>({ selection: null, items: [], error: '', loading: false });
  useEffect(() => {
    if (!selection) return;
    const { video } = selection;
    let cancelled = false;
    setMetadata({ selection, tracks: [], error: '', loading: true });
    biliRequest<SubtitleTrack[]>('subtitles', { bvid: video.bvid, cid: video.cid }).then(tracks => {
      if (!cancelled) setMetadata({ selection, tracks, error: '', loading: false });
    }).catch(error => { if (!cancelled) setMetadata({ selection, tracks: [], error: error.message, loading: false }); });
    return () => { cancelled = true; };
  }, [selection, retry]);
  const tracks = useMemo(() => metadata.selection === selection ? metadata.tracks : [], [metadata, selection]);
  const track = language === 'off' ? undefined : language === 'auto' ? tracks.find(t => t.language.startsWith('zh')) || tracks[0] : tracks.find(t => t.language === language);
  const trackKey = track ? `${key}:${track.id}` : '';
  useEffect(() => {
    if (!trackKey || !selection || !track) return;
    const { video } = selection;
    let cancelled = false;
    setText({ selection, key: trackKey, cues: [], error: '', loading: true });
    biliRequest<SubtitleCue[]>('subtitle', { bvid: video.bvid, cid: video.cid, id: track.id }).then(cues => {
      if (!cancelled) setText({ selection, key: trackKey, cues, error: '', loading: false });
    }).catch(error => { if (!cancelled) setText({ selection, key: trackKey, cues: [], error: error.message, loading: false }); });
    return () => { cancelled = true; };
  }, [selection, trackKey, retry]);
  useEffect(() => {
    if (!selection) { commentCache.current = null; return; }
    if (!danmakuEnabled) return;
    const { video } = selection;
    if (commentCache.current?.selection === selection) {
      setComments({ selection, items: commentCache.current.items, error: '', loading: false }); return;
    }
    let cancelled = false;
    setComments({ selection, items: [], error: '', loading: true });
    biliRequest<string>('danmaku', { bvid: video.bvid, cid: video.cid }).then(xml => {
      if (cancelled) return;
      const items = parseDanmaku(xml);
      commentCache.current = { selection, items };
      setComments({ selection, items, error: '', loading: false });
    }).catch(error => { if (!cancelled) setComments({ selection, items: [], error: error.message, loading: false }); });
    return () => { cancelled = true; };
  }, [selection, danmakuEnabled, danmakuRetry]);
  return {
    tracks, subtitleTrack: track?.id || '', cues: text.selection === selection && text.key === trackKey ? text.cues : [],
    subtitleError: metadata.selection === selection && metadata.error || text.selection === selection && text.key === trackKey && text.error || '',
    subtitleLoading: !!selection && (metadata.selection !== selection || metadata.loading || !!trackKey && (text.selection !== selection || text.key !== trackKey || text.loading)),
    danmakuItems: comments.selection === selection ? comments.items : [], danmakuError: comments.selection === selection ? comments.error : '',
    danmakuLoading: !!selection && danmakuEnabled && (comments.selection !== selection || comments.loading),
    reloadSubtitles: () => setRetry(value => value + 1),
    reloadDanmaku: () => { commentCache.current = null; setDanmakuRetry(value => value + 1); },
  };
}
