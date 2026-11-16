import { Icon } from '../../components/ui/Icon';
import type { SearchVideo } from './types';

function stamp(seconds: number) {
  const total = Math.floor(Math.max(0, seconds)), hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60), rest = (total % 60).toString().padStart(2, '0');
  return hours ? `${hours}:${minutes.toString().padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}
function views(value: number) {
  return value >= 1e8 ? `${(value / 1e8).toFixed(1)}亿` : value >= 1e4 ? `${(value / 1e4).toFixed(1)}万` : value.toLocaleString('zh-CN');
}
export function VideoResultCard({ video, busy, disabled, onPlay }: {
  video: SearchVideo; busy: boolean; disabled: boolean; onPlay: () => void;
}) {
  return <button className={`video-result-card ${busy ? 'is-picking' : ''}`} onClick={onPlay} disabled={disabled} aria-label={`播放 ${video.title}，${video.author}`}>
    <span className="video-result-cover">
      {video.cover && <img src={video.cover} alt="" loading="lazy" referrerPolicy="no-referrer" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />}
      <span className="video-result-play"><Icon name={busy ? 'LoaderCircle' : 'Play'} size={24} /></span>
      <span className="video-result-views"><Icon name="Play" size={12} />{views(video.views)}</span>
      <span className="video-result-duration">{stamp(video.duration)}</span>
    </span>
    <span className="video-result-title" title={video.title}>{video.title}</span>
    <span className="video-result-author" title={video.author}><span className="video-up-badge" aria-hidden="true">UP</span><span>{video.author}</span></span>
  </button>;
}
