import { useCallback } from 'react';
import { useVideo, type Placement } from './VideoProvider';
import { useAccount } from '../account/AccountProvider';
import { useApp } from '../../state/store';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/Button';
const stamp = (s: number) => `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
export function VideoSurface({ place }: { place: Placement }) {
  const player = useVideo(), account = useAccount(), { dispatch } = useApp();
  const active = player.placement === place;
  const host = useCallback((node: HTMLDivElement | null) => player.register(place,node),[place,player.register]);
  const unavailable = account.checking ? '正在检查登录…' : !account.profile ? '登录哔哩哔哩' : !account.eligible ? '检查手机号绑定' : player.loading ? '正在获取首页视频…' : !player.video ? '获取首页视频' : '';
  return <>
    <div className={`bili-stage ${active ? 'active' : 'inactive'}`}>
      {active && <div ref={host} className="bili-video-host" />}
      {(!active || unavailable || !player.playing) && <div className={`bili-video-overlay ${player.video && active && !unavailable ? 'ready' : ''}`}>
        {!active && player.video?.cover && <img src={player.video.cover} referrerPolicy="no-referrer" alt="" />}
        <button className="bili-play-button" disabled={account.checking || player.loading || player.preparing} aria-label={!active ? '在此处播放' : unavailable || '播放'} onClick={() => {
          if (!account.profile) account.openLogin();
          else if (!account.eligible) dispatch({ type: 'NAVIGATE', page: 'profile' });
          else if (!active) player.move(place);
          else if (!player.video) void player.refresh();
          else void player.toggle();
        }}><Icon name={player.preparing || account.checking || player.loading ? 'LoaderCircle' : !active ? 'ArrowDownToLine' : 'Play'} size={26} /></button>
        {(unavailable || !active || player.preparing) && <span>{!active ? (place === 'chat' ? '移回聊天' : '移至右侧') : player.preparing ? '正在加载…' : unavailable}</span>}
      </div>}
    </div>
    {active && player.video && <div className="bili-controls">
      <input className="bili-progress" aria-label="播放进度" type="range" min="0" max={player.duration || 1} step="0.1" value={player.time} disabled={player.preparing || !player.quality} onChange={e => player.seek(Number(e.target.value))} />
      <div className="bili-controls-row">
        <IconButton icon={player.playing ? 'Pause' : 'Play'} label={player.playing ? '暂停' : '播放'} disabled={!account.eligible || player.preparing} onClick={() => void player.toggle()} />
        <span className="bili-time">{stamp(player.time)} / {stamp(player.duration)}</span><div className="spacer" />
        <IconButton icon={player.volume === 0 ? 'VolumeX' : 'Volume2'} label={player.volume === 0 ? '取消静音' : '静音'} onClick={() => player.setVolume(player.volume === 0 ? 1 : 0)} />
        <input className="bili-volume" type="range" min="0" max="1" step="0.01" value={player.volume} aria-label="音量" onChange={e => player.setVolume(Number(e.target.value))} />
        {player.qualities.length > 0 && <select aria-label="清晰度" value={player.quality} onChange={e => player.setQuality(e.target.value)}>{player.qualities.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}</select>}
      </div>
    </div>}
    {(player.error || account.error) && <div className="bili-video-error" role="alert">{player.error || account.error}<button onClick={() => { if (account.error) void account.refresh(); else if (player.video) void player.toggle(); else void player.refresh(); }}>重试</button></div>}
  </>;
}
