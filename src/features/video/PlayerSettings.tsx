import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/ui/Icon';
import { useVideo } from './VideoProvider';
import { DEFAULT_DANMAKU, PLAYBACK_RATES, type DanmakuPreferences } from './preferences';
import { PlayerSelect } from './PlayerSelect';

function Range({ label, value, display, min, max, step = 1, onChange }: { label: string; value: number; display: string; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label className="bili-settings-range"><span>{label}<output>{display}</output></span><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} /></label>;
}
function Row({ label, children }: { label: string; children: ReactNode }) { return <div className="bili-settings-row"><span>{label}</span>{children}</div>; }
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <button type="button" className="bili-switch" role="switch" aria-label={label} aria-checked={checked} onClick={onChange}><span /></button>;
}
export function PlayerSettings({ anchor, onClose }: { anchor: HTMLButtonElement; onClose: () => void }) {
  const player = useVideo(), { preferences: pref } = player, dm = pref.danmaku;
  const [page, setPage] = useState<'main' | 'subtitle' | 'danmaku'>('main'), [closing, setClosing] = useState(false);
  const [direction, setDirection] = useState('forward');
  const root = useRef<HTMLDivElement>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position] = useState(() => { const rect = anchor.getBoundingClientRect(); const width = Math.min(300, window.innerWidth - 16); return { left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)), top: Math.max(8, rect.top - Math.min(520, window.innerHeight - 32) - 8), width }; });
  function dismiss(restoreFocus = false) {
    if (timer.current) return;
    setClosing(true);
    timer.current = setTimeout(() => { onClose(); if (restoreFocus && anchor.isConnected) anchor.focus(); }, 120);
  }
  useEffect(() => {
    root.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node) && !anchor.contains(event.target as Node)) dismiss(); };
    const resize = () => onClose();
    const scroll = (event: Event) => { if (event.target instanceof Node && root.current?.contains(event.target)) return; onClose(); };
    document.addEventListener('pointerdown', outside); window.addEventListener('resize', resize); window.addEventListener('scroll', scroll, true);
    return () => { if (timer.current) clearTimeout(timer.current); document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', resize); window.removeEventListener('scroll', scroll, true); };
  }, []);
  function navigate(next: typeof page) { setDirection(next === 'main' ? 'back' : 'forward'); setPage(next); root.current?.scrollTo({ top: 0 }); }
  function updateDM(patch: Partial<DanmakuPreferences>) { player.updatePreferences({ danmaku: { ...dm, ...patch } }); }
  const tracks = player.tracks;
  const subtitleOptions = tracks.length ? [{ value: 'off', label: '关闭' }, { value: 'auto', label: '自动' }, ...tracks.map(track => ({ value: track.language, label: track.label }))] : [{ value: 'off', label: player.subtitleLoading ? '正在加载' : '暂无字幕' }];
  return createPortal(<div ref={root} className={`bili-settings-panel ${closing ? 'closing' : ''}`} role="dialog" aria-label="播放设置" style={{ ...position, maxHeight: `calc(100vh - ${position.top + 8}px)` }} onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); event.preventDefault(); dismiss(true); }
  }} onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== anchor) dismiss(); }}>
    <header>{page !== 'main' && <button type="button" aria-label="返回播放设置" onClick={() => navigate('main')}><Icon name="ChevronLeft" size={16} /></button>}<strong>{page === 'main' ? '播放设置' : page === 'subtitle' ? '字幕样式' : '弹幕设置'}</strong><button type="button" aria-label="关闭设置" onClick={() => dismiss(true)}><Icon name="X" size={16} /></button></header>
    <div className={`bili-settings-page ${direction}`} key={page}>
      {page === 'main' && <>
        <Range label="音量" value={Math.round(player.volume * 100)} display={`${Math.round(player.volume * 100)}%`} min={0} max={100} onChange={value => player.setVolume(value / 100)} />
        <Row label="清晰度"><PlayerSelect label="清晰度" value={player.quality} options={player.qualities.map(q => ({ value: q.id, label: q.label }))} disabled={!player.qualities.length || player.preparing} onChange={player.setQuality} /></Row>
        <Range label="播放速度" value={PLAYBACK_RATES.indexOf(pref.rate)} display={`${pref.rate}×`} min={0} max={4} onChange={index => player.setRate(PLAYBACK_RATES[index])} />
        <hr />
        <Row label="字幕"><PlayerSelect label="字幕" value={tracks.length && subtitleOptions.some(option => option.value === pref.subtitleLanguage) ? pref.subtitleLanguage : 'off'} options={subtitleOptions} disabled={!tracks.length} onChange={subtitleLanguage => player.updatePreferences({ subtitleLanguage })} /></Row>
        {player.subtitleError && <div className="bili-extra-status">{player.subtitleError}<button onClick={player.reloadSubtitles}>重试</button></div>}
        <button className="bili-settings-link" disabled={!tracks.length} onClick={() => navigate('subtitle')}>字幕样式<Icon name="ChevronRight" size={14} /></button>
        <Row label="显示弹幕"><Switch label="显示弹幕" checked={dm.enabled} onChange={() => updateDM({ enabled: !dm.enabled })} /></Row>
        <button className="bili-settings-link" onClick={() => navigate('danmaku')}>弹幕设置<Icon name="ChevronRight" size={14} /></button>
        <hr />
        <details><summary>快捷键</summary><div className="bili-shortcuts"><span>播放 / 暂停<kbd>Space</kbd></span><span>前后跳转 5 秒<kbd>← / →</kbd></span><span>调整音量<kbd>↑ / ↓</kbd></span><span>静音 / 恢复<kbd>M</kbd></span><span>弹幕开关<kbd>D</kbd></span></div></details>
      </>}
      {page === 'subtitle' && <>
        <Row label="字号"><PlayerSelect label="字幕字号" value={String(pref.subtitleSize)} options={[{ value: '1', label: '标准' }, { value: '1.2', label: '大' }, { value: '1.4', label: '更大' }]} onChange={value => player.updatePreferences({ subtitleSize: Number(value) })} /></Row>
        <Row label="字幕背景"><Switch label="字幕背景" checked={pref.subtitleBackground} onChange={() => player.updatePreferences({ subtitleBackground: !pref.subtitleBackground })} /></Row>
      </>}
      {page === 'danmaku' && <>
        <Row label="显示弹幕"><Switch label="显示弹幕" checked={dm.enabled} onChange={() => updateDM({ enabled: !dm.enabled })} /></Row>
        {player.danmakuLoading && <p className="bili-extra-status">正在加载弹幕…</p>}
        {player.danmakuError && <div className="bili-extra-status">{player.danmakuError}<button onClick={player.reloadDanmaku}>重试</button></div>}
        {!player.danmakuLoading && !player.danmakuError && dm.enabled && !player.danmakuItems.length && <p className="bili-extra-status">暂无弹幕</p>}
        <hr />
        <Range label="不透明度" value={Math.round(dm.opacity * 100)} display={`${Math.round(dm.opacity * 100)}%`} min={10} max={100} onChange={value => updateDM({ opacity: value / 100 })} />
        <Range label="字号" value={dm.fontSize} display={`${dm.fontSize} px`} min={12} max={28} onChange={fontSize => updateDM({ fontSize })} />
        <Range label="滚动区域" value={dm.area * 4} display={['上 1/4 屏', '上半屏', '上 3/4 屏', '全屏'][Math.round(dm.area * 4) - 1]} min={1} max={4} onChange={value => updateDM({ area: value / 4 })} />
        <Range label="滚动速度" value={dm.speed === .7 ? 0 : dm.speed === 1.5 ? 2 : 1} display={dm.speed === .7 ? '慢' : dm.speed === 1.5 ? '快' : '标准'} min={0} max={2} onChange={index => updateDM({ speed: [.7, 1, 1.5][index] })} />
        <details><summary>更多设置</summary>
          <Range label="密度" value={dm.density} display={['稀疏', '适中', '较多'][Math.round(dm.density) - 1]} min={1} max={3} onChange={density => updateDM({ density })} />
          <div className="bili-dm-types">{(['scroll', 'top', 'bottom'] as const).map((type, index) => <button key={type} aria-pressed={dm[type]} onClick={() => updateDM({ [type]: !dm[type] })}>{['滚动', '顶部', '底部'][index]}</button>)}</div>
          <Row label="彩色弹幕"><Switch label="彩色弹幕" checked={dm.color} onChange={() => updateDM({ color: !dm.color })} /></Row>
          <label className="bili-keywords">屏蔽词（逗号分隔）<input value={dm.keywords} onChange={event => updateDM({ keywords: event.target.value })} /></label>
        </details>
        <hr /><button className="bili-settings-reset" onClick={() => updateDM({ ...DEFAULT_DANMAKU })}>恢复默认</button>
      </>}
    </div>
  </div>, document.body);
}
