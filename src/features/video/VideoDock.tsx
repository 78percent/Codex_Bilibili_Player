import { useApp } from '../../state/store';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/Button';
import { useVideo } from './VideoProvider';
import { useAccount } from '../account/AccountProvider';
import { VideoSurface } from './VideoSurface';
export function VideoDock() {
  const { state,dispatch } = useApp(), player = useVideo(), account = useAccount();
  const open = state.settings.videoOpen !== false, expanded = !!state.settings.videoExpanded;
  const title = player.video ? player.video.parts.length > 1 ? `${player.video.title} · ${player.video.partTitle}` : player.video.title : '';
  const update = (value: Record<string,boolean>) => dispatch({ type: 'SETTINGS', value });
  return <section className={`video-dock ${open ? 'open' : 'collapsed'} ${expanded && open ? 'expanded' : ''}`} aria-label="右侧视频窗口">
    <header><button className="video-heading" onClick={() => update({videoOpen: !open,videoExpanded:false})}><Icon name="Clapperboard" size={16} /><span>视频</span><Icon name={open ? 'ChevronDown' : 'ChevronUp'} size={13} /></button><div className="spacer" />
      {open && <><IconButton icon="RefreshCw" label="刷新首页视频" disabled={!account.eligible || player.loading} onClick={() => void player.refresh()} /><IconButton icon="MessagesSquare" label="移回聊天播放" onClick={() => player.move('chat')} /><IconButton icon={expanded ? 'Minimize2' : 'Maximize2'} label={expanded ? '还原视频窗口' : '放大视频窗口'} onClick={() => update({videoExpanded:!expanded})} /><IconButton icon="Minus" label="收起视频窗口" onClick={() => update({videoOpen:false,videoExpanded:false})} /></>}
    </header>
    {open && <div className="bili-dock-body"><VideoSurface place="dock" />{player.video && <p className="bili-dock-title" title={title}>{title}</p>}</div>}
  </section>;
}
