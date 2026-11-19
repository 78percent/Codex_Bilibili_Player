import { Icon } from '../../components/ui/Icon';
import { useUploaderResource, type UploaderRoute } from './browser';
import { Avatar, UploaderFeedback, UploaderPagination, UploaderVideos, type UploaderActions } from './UploaderShared';
import type { UploaderCollection, UploaderCollectionPage, UploaderPeoplePage, UploaderProfile, UploaderVideoPage } from './types';
import { UploaderDynamics } from './UploaderDynamics';

type Props = { route: UploaderRoute; profile: UploaderProfile; actions: UploaderActions };
function CollectionCards({ items, profile, actions }: { items: UploaderCollection[]; profile: UploaderProfile; actions: UploaderActions }) {
  if (!items.length) return <div className="video-search-status">暂无合集</div>;
  return <div className="uploader-collections">{items.map(item => <button key={`${item.kind}-${item.id}`} className="uploader-collection"
    data-browser-focus={`collection-${item.kind}-${item.id}`} onClick={() => actions.onNavigate({ kind: 'collection', target: { mid: profile.mid, name: profile.name }, collection: item, page: 1 })}>
    <span className="uploader-collection-cover">{item.cover && <img src={item.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />}</span>
    <span><strong>{item.title}</strong><small>{item.count} 个视频</small></span><Icon name="ChevronRight" size={15} />
  </button>)}</div>;
}
function VideoSection({ profile, actions, order, title, limit }: { profile: UploaderProfile; actions: UploaderActions; order: 'latest' | 'popular'; title: string; limit: number }) {
  const state = useUploaderResource<UploaderVideoPage>(actions.browser.cache, `videos:${profile.mid}:${order}:1`, 'uploaderVideos', { mid: profile.mid, page: 1, order });
  return <section className="uploader-home-section"><div className="uploader-section-heading"><h2>{title}</h2>
    <button onClick={() => actions.onNavigate({ kind: 'profile', target: { mid: profile.mid, name: profile.name }, tab: 'videos', order, page: 1, offset: '' })}>全部<Icon name="ChevronRight" size={13} /></button></div>
    <UploaderFeedback {...state} onLogin={actions.onLogin} onOfficial={() => actions.onOfficial({ mid: profile.mid })} />
    {state.data && <UploaderVideos videos={state.data.videos.slice(0, limit)} actions={actions} />}
  </section>;
}
function Home({ profile, actions }: Props) {
  const collections = useUploaderResource<UploaderCollectionPage>(actions.browser.cache, `collections:${profile.mid}:1`, 'uploaderCollections', { mid: profile.mid, page: 1 });
  return <><VideoSection profile={profile} actions={actions} order="latest" title="最新投稿" limit={4} />
    <VideoSection profile={profile} actions={actions} order="popular" title="热门视频" limit={4} />
    <section className="uploader-home-section"><div className="uploader-section-heading"><h2>合集</h2>
      <button onClick={() => actions.onNavigate({ kind: 'profile', target: { mid: profile.mid, name: profile.name }, tab: 'collections', order: 'latest', page: 1, offset: '' })}>全部<Icon name="ChevronRight" size={13} /></button></div>
      <UploaderFeedback {...collections} onLogin={actions.onLogin} onOfficial={() => actions.onOfficial({ mid: profile.mid })} />
      {collections.data && <CollectionCards items={collections.data.items.slice(0, 4)} profile={profile} actions={actions} />}
    </section></>;
}
function Videos({ route, profile, actions }: Props & { route: Extract<UploaderRoute, { kind: 'profile' }> }) {
  const state = useUploaderResource<UploaderVideoPage>(actions.browser.cache, `videos:${profile.mid}:${route.order}:${route.page}`, 'uploaderVideos', { mid: profile.mid, page: route.page, order: route.order });
  return <><div className="uploader-section-heading"><h2>投稿</h2><div className="uploader-sort" aria-label="投稿排序">
    {(['latest', 'popular'] as const).map(order => <button key={order} aria-pressed={route.order === order} onClick={() => { if (order !== route.order) actions.onNavigate({ ...route, order, page: 1 }); }}>{order === 'latest' ? '最新' : '最热'}</button>)}</div></div>
    <UploaderFeedback {...state} onLogin={actions.onLogin} onOfficial={() => actions.onOfficial({ mid: profile.mid })} />
    {state.data && <><UploaderVideos videos={state.data.videos} actions={actions} /><UploaderPagination page={state.data.page} pages={state.data.pages} disabled={state.loading || !!actions.selecting} onPage={page => actions.onNavigate({ ...route, page })} /></>}
  </>;
}
function Collections({ route, profile, actions }: Props) {
  const state = useUploaderResource<UploaderCollectionPage>(actions.browser.cache, `collections:${profile.mid}:${route.page}`, 'uploaderCollections', { mid: profile.mid, page: route.page });
  return <><div className="uploader-section-heading"><h2>合集</h2>{state.data && <span>{state.data.total} 个</span>}</div>
    <UploaderFeedback {...state} onLogin={actions.onLogin} onOfficial={() => actions.onOfficial({ mid: profile.mid })} />
    {state.data && <><CollectionCards items={state.data.items} profile={profile} actions={actions} /><UploaderPagination page={state.data.page} pages={state.data.pages} onPage={page => actions.onNavigate({ ...route, page })} /></>}
  </>;
}
function Collection({ route, profile, actions }: Props & { route: Extract<UploaderRoute, { kind: 'collection' }> }) {
  const { collection } = route;
  const state = useUploaderResource<UploaderVideoPage>(actions.browser.cache, `collection:${profile.mid}:${collection.kind}:${collection.id}:${route.page}`, 'uploaderCollectionVideos', { mid: profile.mid, id: collection.id, kind: collection.kind, page: route.page });
  return <><div className="uploader-section-heading"><h2>{collection.title}</h2>{state.data && <span>{state.data.total} 个视频</span>}</div>
    <UploaderFeedback {...state} onLogin={actions.onLogin} onOfficial={() => actions.onOfficial({ mid: profile.mid })} />
    {state.data && <><UploaderVideos videos={state.data.videos} actions={actions} /><UploaderPagination page={state.data.page} pages={state.data.pages} disabled={!!actions.selecting} onPage={page => actions.onNavigate({ ...route, page })} /></>}
  </>;
}
function People({ route, profile, actions }: Props & { route: Extract<UploaderRoute, { kind: 'people' }> }) {
  const state = useUploaderResource<UploaderPeoplePage>(actions.browser.cache, `people:${profile.mid}:${route.relation}:${route.page}`, 'uploaderRelations', { mid: profile.mid, kind: route.relation, page: route.page });
  return <><div className="uploader-section-heading"><h2>{route.relation === 'following' ? '关注' : '粉丝'}</h2>{state.data && <span>{state.data.total.toLocaleString('zh-CN')}</span>}</div>
    <UploaderFeedback {...state} onLogin={actions.onLogin} onOfficial={() => actions.onOfficial({ mid: profile.mid })} />
    {state.data && <><div className="uploader-people">{state.data.items.map(person => <button key={person.mid} className="uploader-person" data-browser-focus={`person-${person.mid}`} onClick={() => actions.onProfile({ mid: person.mid, name: person.name })}>
      <Avatar src={person.avatar} name={person.name} /><span className="uploader-person-copy"><strong>{person.name}</strong>{person.sign && <span>{person.sign}</span>}</span><Icon name="ChevronRight" size={15} />
    </button>)}</div>{!state.data.items.length && <div className="video-search-status">暂无可显示的用户</div>}
      <UploaderPagination page={state.data.page} pages={state.data.pages} onPage={page => actions.onNavigate({ ...route, page })} /></>}
  </>;
}
export function UploaderContents(props: Props) {
  const { route } = props;
  if (route.kind === 'people') return <People {...props} route={route} />;
  if (route.kind === 'collection') return <Collection {...props} route={route} />;
  if (route.tab === 'videos') return <Videos {...props} route={route} />;
  if (route.tab === 'collections') return <Collections {...props} />;
  if (route.tab === 'dynamic') return <UploaderDynamics {...props} route={route} />;
  return <Home {...props} />;
}
