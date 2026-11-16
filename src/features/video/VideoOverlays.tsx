import { useEffect, useMemo, useRef, useState } from 'react';
import { useVideo } from './VideoProvider';
import type { DanmakuItem } from './useVideoExtras';

type PlacedComment = DanmakuItem & { width: number; y: number; life: number };
export function VideoOverlays() {
  const player = useVideo(), { preferences, danmakuItems, cues } = player, dm = preferences.danmaku;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = canvas.current!;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(node); return () => observer.disconnect();
  }, []);
  const comments = useMemo(() => {
    if (!dm.enabled || !size.width || !size.height) return [];
    const context = canvas.current!.getContext('2d')!;
    context.font = `600 ${dm.fontSize}px sans-serif`;
    const line = dm.fontSize + 10, subtitleSpace = player.subtitleTrack ? 64 : 14;
    const topInset = dm.top ? line + 12 : 12;
    const rows = Math.max(1, Math.min(12, Math.floor((Math.min(size.height * dm.area, size.height - subtitleSpace) - topInset) / line)));
    const available = Array(rows).fill(0); let topAvailable = 0, bottomAvailable = 0;
    const keywords = dm.keywords.split(/[,，\n]/).map(word => word.trim()).filter(Boolean);
    const life = 9 / dm.speed, result: PlacedComment[] = [];
    danmakuItems.forEach((item, index) => {
      if (!dm[item.mode] || keywords.some(word => item.content.includes(word)) || index % Math.max(1, 4 - Math.round(dm.density))) return;
      const width = context.measureText(item.content).width;
      if (item.mode === 'scroll') {
        const lane = available.findIndex(until => until <= item.time);
        if (lane === -1) return;
        available[lane] = item.time + life;
        result.push({ ...item, width, life, y: topInset + lane * line });
      } else if (item.mode === 'top' && item.time >= topAvailable) {
        topAvailable = item.time + 4;
        result.push({ ...item, width, life: 4, y: 12 });
      } else if (item.mode === 'bottom' && item.time >= bottomAvailable) {
        bottomAvailable = item.time + 4;
        result.push({ ...item, width, life: 4, y: Math.max(12, size.height - subtitleSpace - line) });
      }
    });
    return result;
  }, [danmakuItems, dm, size, player.subtitleTrack]);
  useEffect(() => {
    const node = canvas.current!, context = node.getContext('2d')!;
    const ratio = window.devicePixelRatio || 1;
    node.width = Math.round(size.width * ratio); node.height = Math.round(size.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    let frame = 0;
    const draw = () => {
      context.clearRect(0, 0, size.width, size.height);
      if (!dm.enabled) return;
      const time = player.getMediaElement().currentTime || 0;
      context.font = `600 ${dm.fontSize}px sans-serif`; context.textBaseline = 'top';
      context.globalAlpha = dm.opacity; context.lineWidth = 2.5; context.lineJoin = 'round'; context.strokeStyle = '#0009';
      let lo = 0, hi = comments.length;
      while (lo < hi) { const mid = (lo + hi) >>> 1; if (comments[mid].time < time - 14) lo = mid + 1; else hi = mid; }
      for (let index = lo; index < comments.length && comments[index].time <= time; index++) {
        const item = comments[index], elapsed = time - item.time;
        if (elapsed >= item.life) continue;
        const x = item.mode === 'scroll' ? size.width - elapsed / item.life * (size.width + item.width) : (size.width - item.width) / 2;
        context.fillStyle = dm.color ? item.color : '#fff';
        context.strokeText(item.content, x, item.y); context.fillText(item.content, x, item.y);
      }
      if (player.playing) frame = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(frame);
  }, [comments, size, dm, player.playing, player.time, player.video?.cid]);
  const subtitle = cues.filter(cue => cue.from <= player.time && cue.to > player.time).map(cue => cue.content).join('\n');
  return <>
    <canvas ref={canvas} className="bili-danmaku-layer" aria-hidden="true" />
    {subtitle && <div className={`bili-subtitle-layer ${preferences.subtitleBackground ? 'with-background' : ''}`}><span style={{ fontSize: `calc(clamp(12px, 2.7cqw, 21px) * ${preferences.subtitleSize})` }}>{subtitle}</span></div>}
  </>;
}
