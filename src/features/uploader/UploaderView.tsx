import { Icon } from '../../components/ui/Icon';
import { useUploaderResource, type UploaderRoute } from './browser';
import { Avatar, count, UploaderFeedback, type UploaderActions } from './UploaderShared';
import { UploaderContents } from './UploaderContents';
import { useUploaderFollow } from './useUploaderFollow';
import type { UploaderProfile, UploaderTab } from './types';
import '../../styles/uploader.css';

const tabs: { id: UploaderTab; label: string }[] = [{ id: 'home', label: '主页' }, { id: 'videos', label: '投稿' }, { id: 'dynamic', label: '动态' }, { id: 'collections', label: '合集' }];
function ProfileHeader({ profile, route, actions }: { profile: UploaderProfile; route: UploaderRoute; actions: UploaderActions }) {
  const { following, error, follow } = useUploaderFollow(profile, actions);
  const target = { mid: profile.mid, name: profile.name };
  return <><div className={`uploader-banner ${profile.banner ? 'has-image' : ''}`}>{profile.banner && <img src={profile.banner} alt="" referrerPolicy="no-referrer" />}</div>
    <div className="uploader-profile-info"><div className="uploader-profile-top"><Avatar src={profile.avatar} name={profile.name} />
      <div className="uploader-profile-name"><h1>{profile.name}</h1>{profile.sign && <p>{profile.sign}</p>}{profile.official && <p className="uploader-official"><Icon name="BadgeCheck" size={13} />{profile.official}</p>}</div>
      {!profile.isSelf && <button className="uploader-follow" aria-pressed={profile.followed ?? undefined} disabled={following || actions.eligible && profile.followed === null}
        title={actions.eligible && profile.followed === null ? '关注状态暂不可用，可在B站主页查看' : undefined} onClick={() => void follow()}>
        <Icon name={following ? 'LoaderCircle' : !actions.uid ? 'Plus' : profile.followed === null ? 'CircleHelp' : profile.followed ? 'Check' : 'Plus'} size={14} />{!actions.uid ? '关注' : profile.followed === null ? '关注状态' : profile.followed ? '已关注' : '关注'}</button>}
    </div><div className="uploader-stats"><button onClick={() => actions.onNavigate({ kind: 'people', target, relation: 'following', page: 1 })}><strong>{count(profile.following)}</strong>关注</button>
      <button onClick={() => actions.onNavigate({ kind: 'people', target, relation: 'followers', page: 1 })}><strong>{count(profile.followers)}</strong>粉丝</button>
      <button onClick={() => actions.onNavigate({ kind: 'profile', target, tab: 'videos', page: 1, order: 'latest', offset: '' })}><strong>{count(profile.videoCount)}</strong>投稿</button>
      <button className="uploader-official-link" onClick={() => actions.onOfficial({ mid: profile.mid })}><Icon name="ExternalLink" size={13} />B站主页</button>
    </div>{error && <UploaderFeedback loading={false} error={error} retry={() => void follow()} onLogin={actions.onLogin} onOfficial={() => actions.onOfficial({ mid: profile.mid })} />}</div>
    <nav className="uploader-tabs" aria-label="UP主内容">{tabs.map(tab => <button key={tab.id} aria-current={route.kind === 'profile' && route.tab === tab.id ? 'page' : undefined}
      data-browser-focus={`tab-${tab.id}`} onClick={() => { if (route.kind !== 'profile' || route.tab !== tab.id) actions.onNavigate({ kind: 'profile', target, tab: tab.id, page: 1, order: 'latest', offset: '' }); }}>{tab.label}</button>)}</nav>
  </>;
}
export function UploaderView({ route, actions }: { route: UploaderRoute; actions: UploaderActions }) {
  const targetKey = route.target.mid || `video-${route.target.bvid}`;
  const state = useUploaderResource<UploaderProfile>(actions.browser.cache, `profile:${targetKey}`, 'uploaderProfile', { mid: route.target.mid, bvid: route.target.bvid });
  return <div className="uploader-page">
    <UploaderFeedback {...state} onLogin={actions.onLogin} onOfficial={route.target.mid ? () => actions.onOfficial({ mid: route.target.mid }) : undefined} />
    {state.data && <><ProfileHeader key={state.data.mid} profile={state.data} route={route} actions={actions} />
      <div className="uploader-content"><UploaderContents route={route} profile={state.data} actions={actions} /></div></>}
  </div>;
}
