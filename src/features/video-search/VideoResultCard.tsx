import { Icon } from '../../components/ui/Icon';
import type { SearchOptions, SearchVideo } from './types';

function stamp(seconds: number) {
  const total = Math.floor(Math.max(0, seconds)), hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60), rest = (total % 60).toString().padStart(2, '0');
  return hours ? `${hours}:${minutes.toString().padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}
function views(value: number) {
  return value >= 1e8 ? `${(value / 1e8).toFixed(1)}亿` : value >= 1e4 ? `${(value / 1e4).toFixed(1)}万` : value.toLocaleString('zh-CN');
}
function publishedAt(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '';
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('zh-CN').replaceAll('/', '.');
}
export function VideoResultCard({ video, busy, disabled, onPlay, onAuthor, order }: {
  video: SearchVideo; busy: boolean; disabled: boolean; onPlay: () => void; onAuthor: () => void; order?: SearchOptions['order'];
}) {
  const metric = order === 'dm' ? video.danmaku === undefined ? '' : `${views(video.danmaku)} 弹幕`
    : order === 'stow' ? video.favorites === undefined ? '' : `${views(video.favorites)} 收藏` : publishedAt(video.publishedAt);
  return <article className={`video-result-card ${busy ? 'is-picking' : ''}`}>
    <button className="video-result-main" onClick={onPlay} disabled={disabled} aria-label={`播放 ${video.title}，${video.author}`} data-browser-focus={`video-${video.bvid}`}>
    <span className="video-result-cover">
      {video.cover && <img src={video.cover} alt="" loading="lazy" referrerPolicy="no-referrer" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />}
      <span className="video-result-play"><Icon name={busy ? 'LoaderCircle' : 'Play'} size={24} /></span>
      <span className="video-result-views"><Icon name="Play" size={12} />{views(video.views)}</span>
      <span className="video-result-duration">{stamp(video.duration)}</span>
    </span>
    <span className="video-result-title" title={video.title}>{video.title}</span>
    </button>
    <button className="video-result-author" onClick={onAuthor} disabled={disabled} title={video.author ? `查看 ${video.author} 的主页` : '查看UP主主页'} data-browser-focus={`author-${video.bvid}`}><span className="video-up-badge" aria-hidden="true">UP</span><span>{video.author || '查看UP主'}</span></button>
    {order && (metric || video.partition) && <div className="video-result-meta">{metric && <span>{metric}</span>}{video.partition && <span>{video.partition}</span>}</div>}
  </article>;
}
