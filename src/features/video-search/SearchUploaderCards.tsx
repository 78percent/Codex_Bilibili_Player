import { Icon } from '../../components/ui/Icon';
import { useUploaderResource } from '../uploader/browser';
import { Avatar, count, type UploaderActions } from '../uploader/UploaderShared';
import { useUploaderFollow } from '../uploader/useUploaderFollow';
import type { UploaderProfile } from '../uploader/types';
import type { SearchUploader } from './types';

function SearchUploaderCard({ item, actions, disabled }: { item: SearchUploader; actions: UploaderActions; disabled: boolean }) {
  const state = useUploaderResource<UploaderProfile>(actions.browser.cache, `profile:${item.mid}`, 'uploaderProfile', { mid: item.mid });
  const profile = state.data, { following, error, follow } = useUploaderFollow(profile, actions);
  const known = profile?.followed !== null && profile?.followed !== undefined;
  const target = { mid: item.mid, name: item.name };
  const unavailable = actions.eligible && !known;
  const followLabel = !actions.uid ? '关注' : !known ? '关注状态' : profile?.followed ? '已关注' : '关注';
  return <article className="video-search-uploader">
    <button type="button" className="video-search-uploader-avatar" disabled={disabled} data-browser-focus={`up-avatar-${item.mid}`}
      aria-label={`查看 ${item.name} 的主页`} onClick={() => actions.onProfile(target)}><Avatar src={item.avatar} name={item.name} /></button>
    <div className="video-search-uploader-copy"><button type="button" className="video-search-uploader-name" disabled={disabled}
      data-browser-focus={`up-name-${item.mid}`} onClick={() => actions.onProfile(target)}>{item.name}</button>
      <div className="video-search-uploader-meta"><span><strong>{count(profile?.followers ?? item.followers)}</strong> 粉丝</span>
        <span><strong>{count(profile?.videoCount ?? item.videoCount)}</strong> 投稿</span></div>
      {item.sign && <p className="video-search-uploader-sign">{item.sign}</p>}
    </div>
    <div className="video-search-uploader-actions">
      {!(profile?.isSelf || item.mid === actions.uid) && <button type="button" className="uploader-follow"
        data-browser-focus={`up-follow-${item.mid}`} aria-pressed={known ? profile?.followed ?? undefined : undefined}
        disabled={disabled || following || unavailable} title={unavailable ? '关注状态暂不可用，可在B站主页查看' : undefined}
        onClick={() => void follow()}><Icon name={following || state.loading && !!actions.uid ? 'LoaderCircle' : actions.uid && !known ? 'CircleHelp' : profile?.followed ? 'Check' : 'Plus'} size={14} />{followLabel}</button>}
      <button type="button" className="video-search-uploader-home" disabled={disabled} data-browser-focus={`up-home-${item.mid}`}
        aria-label={`查看 ${item.name} 的主页`} onClick={() => actions.onProfile(target)}>主页<Icon name="ChevronRight" size={13} /></button>
    </div>
    {(error || state.error) && <div className="video-search-error video-search-uploader-error" role="alert"><span>{error || state.error}</span>
      <button type="button" disabled={disabled || following} onClick={() => error ? void follow() : state.retry()}>重试</button>
      <button type="button" disabled={disabled} onClick={() => actions.onOfficial({ mid: item.mid })}>B站主页</button>
    </div>}
  </article>;
}

export function SearchUploaderCards({ items, actions, disabled }: { items: SearchUploader[]; actions: UploaderActions; disabled: boolean }) {
  if (!items.length) return null;
  return <section className="video-search-uploaders" aria-label="相关 UP 主">
    {items.slice(0, 2).map(item => <SearchUploaderCard key={item.mid} item={item} actions={actions} disabled={disabled} />)}
  </section>;
}
