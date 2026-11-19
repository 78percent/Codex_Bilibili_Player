import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/Button';
import { VideoResultCard } from '../video-search/VideoResultCard';
import type { SearchVideo } from '../video-search/types';
import type { UploaderBrowser, UploaderRoute, UploaderTarget } from './browser';

export type UploaderActions = {
  browser: UploaderBrowser; uid: string; eligible: boolean; selecting: string;
  onPlay: (bvid: string) => void; onLogin: () => void;
  onProfile: (target: UploaderTarget) => void; onNavigate: (route: UploaderRoute) => void;
  onOfficial: (target: { mid?: string; dynamicId?: string }) => void;
};
export function count(value: number | null) {
  if (value === null) return '—';
  return value >= 1e8 ? `${(value / 1e8).toFixed(1)}亿` : value >= 1e4 ? `${(value / 1e4).toFixed(1)}万` : value.toLocaleString('zh-CN');
}
export function Avatar({ src, name, small = false }: { src: string; name: string; small?: boolean }) {
  return <span className={`uploader-avatar ${small ? 'is-small' : ''}`}>
    <span aria-hidden="true">{name.slice(0, 1)}</span>
    {src && <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={event => { event.currentTarget.style.display = 'none'; }} />}
  </span>;
}
export function UploaderFeedback({ loading, error, retry, onLogin, onOfficial }: {
  loading: boolean; error: string; retry: () => void; onLogin: () => void; onOfficial?: () => void;
}) {
  if (loading) return <div className="video-search-status" role="status"><Icon name="LoaderCircle" size={17} />正在加载…</div>;
  if (!error) return null;
  return <div className="video-search-error" role="alert"><span>{error}</span><button onClick={retry}>重试</button>
    <button onClick={onLogin}>登录 / 验证</button>{onOfficial && <button onClick={onOfficial}>B站打开</button>}
  </div>;
}
export function UploaderPagination({ page, pages, onPage, disabled = false }: {
  page: number; pages: number; onPage: (page: number) => void; disabled?: boolean;
}) {
  if (pages <= 1) return null;
  return <nav className="video-search-pagination uploader-pagination" aria-label="分页">
    <IconButton icon="ChevronLeft" label="上一页" disabled={disabled || page <= 1} onClick={() => onPage(page - 1)} />
    <span aria-live="polite">{page} / {pages}</span>
    <IconButton icon="ChevronRight" label="下一页" disabled={disabled || page >= pages} onClick={() => onPage(page + 1)} />
  </nav>;
}
export function UploaderVideos({ videos, actions }: { videos: SearchVideo[]; actions: UploaderActions }) {
  if (!videos.length) return <div className="video-search-status">暂无视频</div>;
  return <div className="video-results-grid">{videos.map(video => <VideoResultCard key={video.bvid} video={video}
    busy={actions.selecting === video.bvid} disabled={!!actions.selecting} onPlay={() => actions.onPlay(video.bvid)}
    onAuthor={() => actions.onProfile({ mid: video.authorId || undefined, bvid: video.bvid, name: video.author })} />)}</div>;
}
