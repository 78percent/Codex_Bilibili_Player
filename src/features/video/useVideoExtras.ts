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
  const [retry, setRetry] = useState(0);
  const [danmakuRetry, setDanmakuRetry] = useState(0);
  const commentCache = useRef<{ key: string; items: DanmakuItem[] } | null>(null);
  const [metadata, setMetadata] = useState<{ key: string; tracks: SubtitleTrack[]; error: string; loading: boolean }>({ key: '', tracks: [], error: '', loading: false });
  const [text, setText] = useState<{ key: string; cues: SubtitleCue[]; error: string; loading: boolean }>({ key: '', cues: [], error: '', loading: false });
  const [comments, setComments] = useState<{ key: string; items: DanmakuItem[]; error: string; loading: boolean }>({ key: '', items: [], error: '', loading: false });
  useEffect(() => {
    if (!key || !video) return;
    let cancelled = false;
    setMetadata({ key, tracks: [], error: '', loading: true });
    biliRequest<SubtitleTrack[]>('subtitles', { bvid: video.bvid, cid: video.cid }).then(tracks => {
      if (!cancelled) setMetadata({ key, tracks, error: '', loading: false });
    }).catch(error => { if (!cancelled) setMetadata({ key, tracks: [], error: error.message, loading: false }); });
    return () => { cancelled = true; };
  }, [key, retry]);
  const tracks = useMemo(() => metadata.key === key ? metadata.tracks : [], [metadata, key]);
  const track = language === 'off' ? undefined : language === 'auto' ? tracks.find(t => t.language.startsWith('zh')) || tracks[0] : tracks.find(t => t.language === language);
  const trackKey = track ? `${key}:${track.id}` : '';
  useEffect(() => {
    if (!trackKey || !video || !track) return;
    let cancelled = false;
    setText({ key: trackKey, cues: [], error: '', loading: true });
    biliRequest<SubtitleCue[]>('subtitle', { bvid: video.bvid, cid: video.cid, id: track.id }).then(cues => {
      if (!cancelled) setText({ key: trackKey, cues, error: '', loading: false });
    }).catch(error => { if (!cancelled) setText({ key: trackKey, cues: [], error: error.message, loading: false }); });
    return () => { cancelled = true; };
  }, [trackKey, retry]);
  useEffect(() => {
    if (!key) { commentCache.current = null; return; }
    if (!video || !danmakuEnabled) return;
    if (commentCache.current?.key === key) {
      setComments({ key, items: commentCache.current.items, error: '', loading: false }); return;
    }
    let cancelled = false;
    setComments({ key, items: [], error: '', loading: true });
    biliRequest<string>('danmaku', { bvid: video.bvid, cid: video.cid }).then(xml => {
      if (cancelled) return;
      const items = parseDanmaku(xml);
      commentCache.current = { key, items };
      setComments({ key, items, error: '', loading: false });
    }).catch(error => { if (!cancelled) setComments({ key, items: [], error: error.message, loading: false }); });
    return () => { cancelled = true; };
  }, [key, danmakuEnabled, danmakuRetry]);
  return {
    tracks, subtitleTrack: track?.id || '', cues: text.key === trackKey ? text.cues : [],
    subtitleError: metadata.key === key && metadata.error || text.key === trackKey && text.error || '',
    subtitleLoading: !!key && (metadata.key !== key || metadata.loading || !!trackKey && (text.key !== trackKey || text.loading)),
    danmakuItems: comments.key === key ? comments.items : [], danmakuError: comments.key === key ? comments.error : '',
    danmakuLoading: !!key && danmakuEnabled && (comments.key !== key || comments.loading),
    reloadSubtitles: () => setRetry(value => value + 1),
    reloadDanmaku: () => { commentCache.current = null; setDanmakuRetry(value => value + 1); },
  };
}
