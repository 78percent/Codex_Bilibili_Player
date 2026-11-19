import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/Button';
import { useAccount } from '../account/AccountProvider';
import { useVideo } from '../video/VideoProvider';
import { useApp } from '../../state/store';
import { useVideoSearch } from './VideoSearchProvider';
import { VideoResultCard } from './VideoResultCard';
import { RecentSearches } from './RecentSearches';
import { SearchTelevision } from './SearchTelevision';
import { SearchControls } from './SearchControls';
import { SearchUploaderCards } from './SearchUploaderCards';
import { biliRequest } from '../account/api';
import { UploaderView } from '../uploader/UploaderView';
import type { UploaderRoute, UploaderTarget } from '../uploader/browser';
import type { UploaderActions } from '../uploader/UploaderShared';

function SuggestionLabel({ term, query }: { term: string; query: string }) {
  const start = term.toLocaleLowerCase().indexOf(query.trim().toLocaleLowerCase());
  if (start < 0) return <>{term}</>;
  const end = start + query.trim().length;
  return <>{term.slice(0, start)}<mark>{term.slice(start, end)}</mark>{term.slice(end)}</>;
}

function SearchPanel() {
  const search = useVideoSearch(), account = useAccount(), player = useVideo(), { dispatch } = useApp();
  const { snapshot, searching } = search, { draft, mode } = snapshot;
  const browser = search.browser, route = browser.current, isSearch = route.kind === 'search';
  const editingResults = isSearch && route.address?.mode === 'results' && mode !== 'results';
  const result = mode === 'results' ? snapshot.result : null;
  const panel = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null), scroll = useRef<HTMLDivElement>(null);
  const mounted = useRef(true), picking = useRef(false);
  const previousFocus = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const suggestionHeight = useRef(300);
  const restoring = useRef(false), accountId = account.profile?.uid || 'guest', owner = useRef(accountId);
  owner.current = accountId;
  const [selecting, setSelecting] = useState(''), [playError, setPlayError] = useState(''), [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [failedVideo, setFailedVideo] = useState(''), [officialError, setOfficialError] = useState('');
  const officialTarget = useRef<{ mid?: string; dynamicId?: string }>({});
  const officialRevision = useRef(0);
  const showSuggestions = isSearch && mode === 'suggestions';
  const suggestions = showSuggestions ? snapshot.suggestions : [];
  const suggestionsPending = showSuggestions && search.suggesting;

  function updateDraft(value: string) {
    if (mode === 'results') rememberLocation();
    if (!showSuggestions && value.trim()) suggestionHeight.current = Math.max(300, scroll.current?.getBoundingClientRect().height || 0);
    search.setDraft(value);
  }
  function rememberLocation() {
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.browserFocus || '' : '';
    if (!editingResults) browser.remember(scroll.current?.scrollTop || 0, focused);
    if (isSearch) browser.captureSearch(snapshot);
  }
  function navigate(next: UploaderRoute) { rememberLocation(); browser.navigate(next); }
  function openProfile(target: UploaderTarget) { rememberLocation(); browser.openProfile(target); }
  function travel(step: number) { rememberLocation(); browser.travel(step); }
  function searchHome() { rememberLocation(); browser.search(); }

  useEffect(() => {
    mounted.current = true;
    const previous = previousFocus.current;
    if (isSearch) input.current?.focus(); else panel.current?.focus();
    const key = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ['k', 'n', 'b', ','].includes(event.key.toLowerCase())) {
        event.preventDefault(); event.stopPropagation(); return;
      }
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); search.close(); }
      if (event.key !== 'Tab') return;
      const items = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]') || [])]
        .filter(item => item.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', key, true);
    return () => { mounted.current = false; document.removeEventListener('keydown', key, true); previous?.focus(); };
  }, []);
  useLayoutEffect(() => {
    const node = scroll.current;
    if (!node) return;
    const top = editingResults ? snapshot.scrollTop : route.scrollTop;
    const focusKey = editingResults ? '' : route.focusKey;
    restoring.current = true;
    const restore = () => {
      if (!restoring.current) return;
      node.scrollTop = top;
      const focus = focusKey ? node.querySelector<HTMLElement>(`[data-browser-focus="${CSS.escape(focusKey)}"]`) : null;
      focus?.focus({ preventScroll: true });
      if (node.scrollHeight >= top + node.clientHeight && (!focusKey || focus)) restoring.current = false;
    };
    restore();
    const observer = new ResizeObserver(restore);
    for (const child of node.children) observer.observe(child);
    // Related uploaders can arrive after the video grid without resizing it.
    const contentObserver = new MutationObserver(() => {
      if (!restoring.current) return;
      for (const child of node.children) observer.observe(child);
      restore();
    });
    contentObserver.observe(node, { childList: true, subtree: true });
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus({ preventScroll: true });
    return () => { observer.disconnect(); contentObserver.disconnect(); restoring.current = false; };
  }, [search.ready, browser.ready, route.id, mode]);
  useLayoutEffect(() => {
    const node = scroll.current;
    if (!showSuggestions || !node) return;
    const measure = () => {
      const style = getComputedStyle(node);
      const available = node.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const rowHeight = node.querySelector('[role="option"]')?.getBoundingClientRect().height || 46;
      search.setSuggestionCount(Math.max(6, Math.min(20, Math.ceil(available / rowHeight))));
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(node);
    return () => observer.disconnect();
  }, [showSuggestions, search.setSuggestionCount]);
  useEffect(() => { setActiveSuggestion(-1); }, [draft, snapshot.suggestions]);
  useEffect(() => { setPlayError(''); setFailedVideo(''); setOfficialError(''); }, [accountId]);
  useEffect(() => { officialRevision.current++; setOfficialError(''); }, [route.id]);
  useEffect(() => {
    if (activeSuggestion >= 0) document.getElementById(`video-suggestion-${activeSuggestion}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeSuggestion]);

  function login() {
    search.close();
    if (!account.profile) account.openLogin();
    else dispatch({ type: 'NAVIGATE', page: 'profile' });
  }
  async function play(bvid: string) {
    if (picking.current) return;
    if (!account.eligible) { login(); return; }
    const key = accountId;
    picking.current = true; setSelecting(bvid); setPlayError(''); setFailedVideo(''); rememberLocation();
    try {
      await player.playSearchVideo(bvid);
      if (mounted.current && owner.current === key) search.close();
    } catch (e) { if (mounted.current && owner.current === key) { setPlayError((e as Error).message); setFailedVideo(bvid); } }
    finally { picking.current = false; if (mounted.current) setSelecting(''); }
  }
  async function openOfficial(target: { mid?: string; dynamicId?: string }) {
    const key = accountId, revision = ++officialRevision.current; officialTarget.current = target; setOfficialError('');
    try { await biliRequest('uploaderOpen', target); }
    catch (e) { if (mounted.current && owner.current === key && revision === officialRevision.current) setOfficialError((e as Error).message); }
  }
  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) { if (event.key === 'Enter') event.preventDefault(); return; }
    if (suggestionsPending) return;
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault(); setActiveSuggestion(old => (old + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault(); setActiveSuggestion(old => (old <= 0 ? suggestions.length : old) - 1);
    } else if (event.key === 'Enter' && activeSuggestion >= 0 && suggestions[activeSuggestion]) {
      event.preventDefault(); rememberLocation(); void search.search(suggestions[activeSuggestion]);
    }
  }
  const uploaderActions: UploaderActions = { browser: { ...browser, travel },
    uid: account.profile?.uid || '', eligible: account.eligible, selecting, onPlay: bvid => void play(bvid), onLogin: login,
    onProfile: openProfile, onNavigate: navigate, onOfficial: target => void openOfficial(target) };

  return createPortal(<div className="video-search-scrim" onMouseDown={e => { if (e.currentTarget === e.target) search.close(); }}>
    <div ref={panel} tabIndex={-1} onPointerDown={() => { restoring.current = false; }} onKeyDown={() => { restoring.current = false; }}
      className={`video-search-dialog ${mode === 'results' || !isSearch ? 'has-results' : ''} ${showSuggestions ? 'has-suggestions' : ''} ${!isSearch ? 'has-uploader' : ''}`} role="dialog" aria-modal="true" aria-label={isSearch ? '搜索B站视频' : 'UP主主页'}>
      <header className="uploader-browser-toolbar"><nav aria-label="浏览历史"><IconButton icon="ArrowLeft" label="后退" disabled={!browser.canBack || !!selecting} onClick={() => travel(-1)} />
        <IconButton icon="ArrowRight" label="前进" disabled={!browser.canForward || !!selecting} onClick={() => travel(1)} /></nav>
        <span>{isSearch ? '搜索' : route.target.name || 'UP主主页'}{!isSearch && route.kind === 'people' ? ` · ${route.relation === 'following' ? '关注' : '粉丝'}` : !isSearch && route.kind === 'collection' ? ` · ${route.collection.title}` : ''}</span>
        {!isSearch && <IconButton icon="Search" label="回到搜索" disabled={!!selecting} onClick={searchHome} />}
        <IconButton icon="X" label="关闭视频搜索" onClick={() => { rememberLocation(); search.close(); }} /></header>
      {isSearch && <form className="video-search-input" onSubmit={e => { e.preventDefault(); if (!selecting) { rememberLocation(); void search.search(draft); } }}>
        <SearchTelevision busy={suggestionsPending || searching} />
        <input ref={input} value={draft} maxLength={200} placeholder="搜索B站视频" aria-label="搜索B站视频"
          role="combobox" aria-autocomplete="list" aria-expanded={suggestions.length > 0}
          aria-controls={suggestions.length ? 'video-search-suggestions' : undefined}
          aria-activedescendant={!suggestionsPending && activeSuggestion >= 0 && suggestions[activeSuggestion] ? `video-suggestion-${activeSuggestion}` : undefined}
          onChange={e => updateDraft(e.target.value)} onCompositionStart={() => search.setComposing(true)} onCompositionEnd={e => { search.setComposing(false); updateDraft(e.currentTarget.value); }} onKeyDown={onInputKey} disabled={!!selecting} />
        {draft && <IconButton type="button" className="icon-button video-search-clear" icon="CircleX" label="清空搜索" disabled={!!selecting} onClick={() => { rememberLocation(); search.clear(); input.current?.focus(); }} />}
        <button className="video-search-submit" type="submit" disabled={!draft.trim() || !search.ready || !!selecting} aria-label="搜索">
          <Icon name={searching ? 'LoaderCircle' : 'ArrowRight'} size={19} />
        </button>
      </form>}
      {playError && <div className="video-search-error" role="alert"><span>{playError}</span><button disabled={!!selecting} onClick={() => void play(failedVideo)}>重试播放</button>{!account.eligible && <button onClick={login}>登录 / 验证</button>}</div>}
      {officialError && <div className="video-search-error" role="alert"><span>{officialError}</span><button onClick={() => void openOfficial(officialTarget.current)}>重试</button></div>}
      <div ref={scroll} className="video-search-scroll" style={showSuggestions ? { height: suggestionHeight.current } : undefined}
        onWheel={() => { restoring.current = false; }} onPointerDown={() => { restoring.current = false; }} onKeyDown={() => { restoring.current = false; }}
        onScroll={e => { if (!restoring.current) { if (!editingResults) browser.remember(e.currentTarget.scrollTop); if (isSearch) search.setScrollTop(e.currentTarget.scrollTop); } }}>
        {!search.ready || !browser.ready ? <div className="video-search-status" role="status">正在加载…</div> : !isSearch ? <UploaderView key={`${accountId}:${route.id}`} route={route} actions={uploaderActions} /> : <>
          {mode === 'discovery' && <><section className="video-hot-search" aria-label="B站热搜">
            <div className="video-search-section-heading"><h2><Icon name="Flame" size={15} />B站热搜</h2><IconButton icon="RefreshCw" label="刷新热搜" disabled={search.hotLoading} onClick={() => void search.loadHot()} /></div>
            {snapshot.hot.length > 0 && <ol>{snapshot.hot.map((item, index) => <li key={item.keyword}>
              <button onClick={() => void search.search(item.keyword)}><span className={index < 3 ? 'hot-rank top' : 'hot-rank'}>{String(index + 1).padStart(2, '0')}</span><span>{item.label}</span></button>
            </li>)}</ol>}
            {search.hotLoading && !snapshot.hot.length && <div className="video-search-status" role="status">正在获取热搜…</div>}
            {search.hotError && <div className="video-search-error" role="alert"><span>{search.hotError}</span><button onClick={() => void search.loadHot()}>重试</button>{!account.eligible && <button onClick={login}>{account.profile ? '检查账号' : '登录'}</button>}</div>}
          </section><RecentSearches terms={snapshot.recent} onSearch={term => void search.search(term)} /></>}
          {showSuggestions && <div className="video-search-suggestions" aria-busy={suggestionsPending}>
            {suggestions.length > 0 && <div id="video-search-suggestions" role="listbox" aria-label="搜索联想">{suggestions.map((term, index) => <button key={term} id={`video-suggestion-${index}`} role="option" aria-selected={index === activeSuggestion}
              disabled={suggestionsPending} onClick={() => void search.search(term)} onMouseEnter={() => { if (!suggestionsPending) setActiveSuggestion(index); }}><Icon name="Search" size={16} /><span><SuggestionLabel term={term} query={draft} /></span><Icon name="CornerUpLeft" size={15} /></button>)}</div>}
            {search.suggestError && <div className="video-search-error" role="status">{search.suggestError}</div>}
          </div>}
          {mode === 'results' && <SearchControls options={snapshot.options} filtersOpen={snapshot.filtersOpen} disabled={!!selecting}
            onChange={options => { rememberLocation(); void search.changeOptions(options); }} onToggle={search.toggleFilters} />}
          {search.showUploaders && <>
            {search.uploaders.loading && <div className="video-search-status subtle" role="status">正在获取相关 UP…</div>}
            {search.uploaders.error && <div className="video-search-error" role="alert"><span>相关 UP：{search.uploaders.error}</span><button onClick={search.uploaders.retry}>重试</button></div>}
            {!!search.uploaders.data?.length && <SearchUploaderCards key={accountId} items={search.uploaders.data} actions={uploaderActions} disabled={!!selecting} />}
          </>}
          {searching && <div className="video-search-status" role="status"><Icon name="LoaderCircle" size={18} />正在搜索…</div>}
          {search.error && <div className="video-search-error" role="alert"><span>{search.error}</span><button onClick={() => void search.retry()}>重试</button>{!account.eligible && <button onClick={login}>{account.profile ? '检查账号' : '登录'}</button>}</div>}
          {result && <section className="video-search-results" aria-label={`${result.keyword}的视频结果`} aria-busy={searching}>
            <div className="video-search-section-heading video-results-heading"><h2>视频</h2><span>{result.total.toLocaleString('zh-CN')} 个结果</span><button disabled={!!selecting} onClick={() => { rememberLocation(); search.clear(); input.current?.focus(); }}><Icon name="ArrowLeft" size={13} />热搜</button></div>
            <div className="video-results-grid">{result.videos.map(video => <VideoResultCard key={video.bvid} video={video} order={snapshot.options.order} busy={selecting === video.bvid} disabled={searching || !!selecting} onPlay={() => void play(video.bvid)} onAuthor={() => openProfile({ mid: video.authorId || undefined, bvid: video.bvid, name: video.author })} />)}</div>
            {!result.videos.length && !searching && <div className="video-search-status">没有找到相关视频</div>}
            {result.pages > 1 && <nav className="video-search-pagination" aria-label="搜索结果分页">
              <IconButton icon="ChevronLeft" label="上一页" disabled={searching || !!selecting || result.page <= 1} onClick={() => { rememberLocation(); void search.goToPage(result.page - 1); }} />
              <span aria-live="polite">{result.page} / {result.pages}</span>
              <IconButton icon="ChevronRight" label="下一页" disabled={searching || !!selecting || result.page >= result.pages} onClick={() => { rememberLocation(); void search.goToPage(result.page + 1); }} />
            </nav>}
          </section>}
        </>}
      </div>
    </div>
  </div>, document.body);
}
export function VideoSearchDialog() {
  const { open } = useVideoSearch();
  return open ? <SearchPanel /> : null;
}
