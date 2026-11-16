import { useRef, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/Button';
import { useVideo } from './VideoProvider';
import { PlayerSettings } from './PlayerSettings';
const stamp = (value: number) => `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;

export function VideoControls() {
  const player = useVideo(), [settings, setSettings] = useState(false), [volumeDismissed, setVolumeDismissed] = useState(false), [dragging, setDragging] = useState(false);
  const settingsButton = useRef<HTMLButtonElement>(null), volumeButton = useRef<HTMLButtonElement>(null);
  const busy = player.loading || player.preparing;
  return <div className="bili-controls">
    <input className="bili-progress" aria-label="播放进度" type="range" min={0} max={player.duration || 1} step={.1} value={player.time} disabled={busy || !player.quality} onChange={event => player.seek(Number(event.target.value))} />
    <div className="bili-controls-row">
      <div className="bili-transport">
        <IconButton icon="SkipBack" label="上一条视频" disabled={busy || !player.video?.canPrevious} onClick={() => void player.previous()} />
        <IconButton icon={player.playing ? 'Pause' : 'Play'} label={player.playing ? '暂停' : '播放'} disabled={busy} onClick={() => void player.toggle()} />
        <IconButton icon="SkipForward" label="下一条视频" disabled={busy || !player.video?.canNext} onClick={() => void player.next()} />
        <span className="bili-time">{stamp(player.time)}<span className="bili-total"> / {stamp(player.duration)}</span></span>
      </div>
      <div className="bili-control-tools">
        <div className={`bili-volume-control ${volumeDismissed || settings ? 'dismissed' : ''} ${dragging ? 'dragging' : ''}`} onPointerEnter={() => setVolumeDismissed(false)} onFocus={event => { if (!event.currentTarget.contains(event.relatedTarget)) setVolumeDismissed(false); }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setVolumeDismissed(true); volumeButton.current?.focus(); } }}>
          <button ref={volumeButton} className="icon-button" aria-label={player.volume === 0 ? '恢复声音' : '静音'} aria-pressed={player.volume === 0} onClick={player.toggleMute}><Icon name={player.volume === 0 ? 'VolumeX' : 'Volume2'} /></button>
          <div className="bili-volume-flyout"><output>{Math.round(player.volume * 100)}%</output><input aria-label="音量" aria-orientation="vertical" type="range" min={0} max={1} step={.01} value={player.volume}
            onPointerDown={event => { setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)} onLostPointerCapture={() => setDragging(false)} onChange={event => player.setVolume(Number(event.target.value))} /></div>
        </div>
        <button className="bili-danmaku-toggle" aria-label="弹幕" aria-pressed={player.preferences.danmaku.enabled} onClick={() => player.updatePreferences({ danmaku: { ...player.preferences.danmaku, enabled: !player.preferences.danmaku.enabled } })}>弹幕<span /></button>
        <button className="icon-button" ref={settingsButton} aria-label="播放设置" title="播放设置" aria-expanded={settings} onClick={() => { setSettings(value => !value); setVolumeDismissed(true); }}><Icon name="Settings" /></button>
      </div>
    </div>
    {settings && settingsButton.current && <PlayerSettings anchor={settingsButton.current} onClose={() => setSettings(false)} />}
  </div>;
}
