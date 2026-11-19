import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/Button';
import { biliRequest } from '../account/api';
import { useUploaderResource, type UploaderRoute } from './browser';
import { Avatar, count, UploaderFeedback, UploaderVideos, type UploaderActions } from './UploaderShared';
import type { UploaderCommentPage, UploaderDynamic, UploaderDynamicPage, UploaderProfile } from './types';

function Images({ images }: { images: string[] }) {
  return images.length ? <div className={`uploader-post-images ${images.length === 1 ? 'is-single' : ''}`}>
    {images.map((src, index) => <img key={`${src}-${index}`} src={src} alt={`动态图片 ${index + 1}`} loading="lazy" referrerPolicy="no-referrer" />)}
  </div> : null;
}
function Comments({ post, actions }: { post: UploaderDynamic; actions: UploaderActions }) {
  const [paging, setPaging] = useState({ cursors: [1], index: 0, firstPage: 1 });
  const next = paging.cursors[paging.index];
  const state = useUploaderResource<UploaderCommentPage>(actions.browser.cache, `comments:${post.commentType}:${post.commentId}:${next}`, 'uploaderComments', { oid: post.commentId, type: post.commentType, next });
  function forward() {
    if (!state.data?.more || state.data.next === next) return;
    const cursors = [...paging.cursors.slice(0, paging.index + 1), state.data.next];
    const removed = Math.max(0, cursors.length - 24);
    setPaging({ cursors: cursors.slice(-24), index: Math.min(23, cursors.length - 1), firstPage: paging.firstPage + removed });
  }
  return <div className="uploader-comments">
    <UploaderFeedback {...state} onLogin={actions.onLogin} onOfficial={() => actions.onOfficial({ dynamicId: post.id })} />
    {state.data && <>{state.data.items.map(comment => <div className="uploader-comment" key={comment.id}>
      <button className="uploader-comment-author" onClick={() => actions.onProfile({ mid: comment.author.mid, name: comment.author.name })}>{comment.author.name}</button>
      <p>{comment.message}</p>
    </div>)}{!state.data.items.length && <div className="video-search-status">暂无评论</div>}
      {(paging.index > 0 || state.data.more) && <nav className="video-search-pagination uploader-pagination" aria-label="评论分页">
        <IconButton icon="ChevronLeft" label="上一页评论" disabled={state.loading || paging.index <= 0} onClick={() => setPaging(old => ({ ...old, index: old.index - 1 }))} />
        <span>{paging.firstPage + paging.index}</span><IconButton icon="ChevronRight" label="下一页评论" disabled={state.loading || !state.data.more || state.data.next === next} onClick={forward} />
      </nav>}
    </>}
  </div>;
}
function DynamicPost({ post, actions, comments, onComments }: { post: UploaderDynamic; actions: UploaderActions; comments: boolean; onComments: () => void }) {
  const [liking, setLiking] = useState(false), [error, setError] = useState('');
  const locked = useRef(false), alive = useRef(true), currentAccount = useRef(actions.uid);
  currentAccount.current = actions.uid;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function like() {
    if (!actions.eligible) { actions.onLogin(); return; }
    if (locked.current || post.liked === null) return;
    const owner = actions.uid;
    locked.current = true; setLiking(true); setError('');
    try {
      const result = await biliRequest<{ liked: boolean }>('uploaderDynamicLike', { id: post.id, like: !post.liked, uid: owner });
      actions.browser.cache.update<UploaderDynamicPage>('dynamics:', page => ({ ...page, items: page.items.map(item => item.id === post.id
        ? { ...item, liked: result.liked, likes: Math.max(0, item.likes + (result.liked === item.liked ? 0 : result.liked ? 1 : -1)) } : item) }));
    } catch (e) { if (alive.current && currentAccount.current === owner) setError((e as Error).message); }
    finally { locked.current = false; if (alive.current && currentAccount.current === owner) setLiking(false); }
  }
  return <article className="uploader-post">
    <div className="uploader-post-heading"><button className="uploader-post-author" onClick={() => actions.onProfile({ mid: post.author.mid, name: post.author.name })}>
      <Avatar src={post.author.avatar} name={post.author.name} small /><span><strong>{post.author.name}</strong><small>{post.publishedAt}</small></span></button>
      <IconButton icon="ExternalLink" label="在B站打开动态" onClick={() => actions.onOfficial({ dynamicId: post.id })} /></div>
    {post.text && <p>{post.text}</p>}<Images images={post.images} />
    {post.video && <div className="uploader-post-video"><UploaderVideos videos={[post.video]} actions={actions} /></div>}
    {post.original && <div className="uploader-original"><strong>{post.original.author}</strong>{post.original.text && <p>{post.original.text}</p>}
      <Images images={post.original.images} />{post.original.video && <div className="uploader-post-video"><UploaderVideos videos={[post.original.video]} actions={actions} /></div>}
    </div>}
    <div className="uploader-post-actions"><button aria-pressed={post.liked ?? undefined} disabled={liking || post.liked === null} title={post.liked === null ? '点赞状态暂不可用，可在B站查看' : undefined} onClick={() => void like()}><Icon name={liking ? 'LoaderCircle' : 'ThumbsUp'} size={15} />{count(post.likes)}</button>
      <button aria-expanded={comments} disabled={!post.commentId || !post.commentType} onClick={onComments}><Icon name="MessageSquare" size={15} />{count(post.comments)}</button>
    </div>
    {error && <UploaderFeedback loading={false} error={error} retry={() => void like()} onLogin={actions.onLogin} onOfficial={() => actions.onOfficial({ dynamicId: post.id })} />}
    {comments && <Comments post={post} actions={actions} />}
  </article>;
}
export function UploaderDynamics({ route, profile, actions }: { route: Extract<UploaderRoute, { kind: 'profile' }>; profile: UploaderProfile; actions: UploaderActions }) {
  const [comments, setComments] = useState('');
  const state = useUploaderResource<UploaderDynamicPage>(actions.browser.cache, `dynamics:${profile.mid}:${route.offset}`, 'uploaderDynamics', { mid: profile.mid, offset: route.offset || undefined });
  const canNext = state.data?.more && !!state.data.offset && state.data.offset !== route.offset;
  return <div className="uploader-feed"><UploaderFeedback {...state} onLogin={actions.onLogin} onOfficial={() => actions.onOfficial({ mid: profile.mid })} />
    {state.data && <>{state.data.items.map(post => <DynamicPost key={post.id} post={post} actions={actions} comments={comments === post.id} onComments={() => setComments(value => value === post.id ? '' : post.id)} />)}
      {!state.data.items.length && <div className="video-search-status">暂无动态</div>}
      {(route.page > 1 || state.data.more) && <nav className="video-search-pagination uploader-pagination" aria-label="动态分页">
        <IconButton icon="ChevronLeft" label="上一页动态" disabled={state.loading || route.page <= 1 || !actions.browser.canBack} onClick={() => actions.browser.travel(-1)} />
        <span>{route.page}</span><IconButton icon="ChevronRight" label="下一页动态" disabled={state.loading || !canNext} onClick={() => actions.onNavigate({ ...route, page: route.page + 1, offset: state.data!.offset })} />
      </nav>}
    </>}
  </div>;
}
