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

function SuggestionLabel({ term, query }: { term: string; query: string }) {
  const start = term.toLocaleLowerCase().indexOf(query.trim().toLocaleLowerCase());
  if (start < 0) return <>{term}</>;
  const end = start + query.trim().length;
  return <>{term.slice(0, start)}<mark>{term.slice(start, end)}</mark>{term.slice(end)}</>;
}

function SearchPanel() {
  const search = useVideoSearch(), account = useAccount(), player = useVideo(), { dispatch } = useApp();
  const { snapshot, searching } = search, { draft, mode } = snapshot;
  const result = mode === 'results' ? snapshot.result : null;
  const panel = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null), scroll = useRef<HTMLDivElement>(null);
  const mounted = useRef(true), picking = useRef(false);
  const [selecting, setSelecting] = useState(''), [playError, setPlayError] = useState(''), [activeSuggestion, setActiveSuggestion] = useState(-1);
  const showSuggestions = mode === 'suggestions';
  const suggestions = showSuggestions ? snapshot.suggestions : [];

  useEffect(() => {
    mounted.current = true;
    const previous = document.activeElement as HTMLElement | null;
    input.current?.focus();
    const key = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ['k', 'n', 'b', ','].includes(event.key.toLowerCase())) {
        event.preventDefault(); event.stopPropagation(); return;
      }
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); search.close(); }
      if (event.key !== 'Tab') return;
      const items = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]') || [])]
        .filter(item => item.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', key, true);
    return () => { mounted.current = false; document.removeEventListener('keydown', key, true); previous?.focus(); };
  }, []);
  useLayoutEffect(() => {
    if (scroll.current) scroll.current.scrollTop = snapshot.scrollTop;
  }, [search.ready, result, mode]);
  useEffect(() => { setActiveSuggestion(-1); }, [draft, snapshot.suggestions]);

  function login() {
    search.close();
    if (!account.profile) account.openLogin();
    else dispatch({ type: 'NAVIGATE', page: 'profile' });
  }
  async function play(bvid: string) {
    if (picking.current) return;
    if (!account.eligible) { login(); return; }
    picking.current = true; setSelecting(bvid); setPlayError('');
    try {
      await player.playSearchVideo(bvid);
      if (mounted.current) search.close();
    } catch (e) { if (mounted.current) setPlayError((e as Error).message); }
    finally { picking.current = false; if (mounted.current) setSelecting(''); }
  }
  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) { if (event.key === 'Enter') event.preventDefault(); return; }
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault(); setActiveSuggestion(old => (old + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault(); setActiveSuggestion(old => (old <= 0 ? suggestions.length : old) - 1);
    } else if (event.key === 'Enter' && activeSuggestion >= 0 && suggestions[activeSuggestion]) {
      event.preventDefault(); void search.search(suggestions[activeSuggestion]);
    }
  }

  return createPortal(<div className="video-search-scrim" onMouseDown={e => { if (e.currentTarget === e.target) search.close(); }}>
    <div ref={panel} className={`video-search-dialog ${mode === 'results' ? 'has-results' : ''} ${showSuggestions ? 'has-suggestions' : ''}`} role="dialog" aria-modal="true" aria-label="搜索B站视频">
      <form className="video-search-input" onSubmit={e => { e.preventDefault(); if (!selecting) void search.search(draft); }}>
        <Icon name="Search" size={21} />
        <input ref={input} value={draft} maxLength={200} placeholder="搜索B站视频" aria-label="搜索B站视频"
          role="combobox" aria-autocomplete="list" aria-expanded={suggestions.length > 0}
          aria-controls={suggestions.length ? 'video-search-suggestions' : undefined}
          aria-activedescendant={activeSuggestion >= 0 && suggestions[activeSuggestion] ? `video-suggestion-${activeSuggestion}` : undefined}
          onChange={e => search.setDraft(e.target.value)} onKeyDown={onInputKey} disabled={!!selecting} />
        {draft && <IconButton type="button" className="icon-button video-search-clear" icon="CircleX" label="清空搜索" disabled={!!selecting} onClick={() => { search.clear(); input.current?.focus(); }} />}
        <button className="video-search-submit" type="submit" disabled={!draft.trim() || !search.ready || !!selecting} aria-label="搜索">
          <Icon name={searching ? 'LoaderCircle' : 'ArrowRight'} size={19} />
        </button>
        <span className="video-search-bar-divider" aria-hidden="true" />
        <IconButton type="button" icon="X" label="关闭视频搜索" onClick={search.close} />
      </form>
      <div ref={scroll} className="video-search-scroll" onScroll={e => search.setScrollTop(e.currentTarget.scrollTop)}>
        {!search.ready ? <div className="video-search-status" role="status">正在加载…</div> : <>
          {mode === 'discovery' && <><section className="video-hot-search" aria-label="B站热搜">
            <div className="video-search-section-heading"><h2><Icon name="Flame" size={15} />B站热搜</h2><IconButton icon="RefreshCw" label="刷新热搜" disabled={search.hotLoading} onClick={() => void search.loadHot()} /></div>
            {snapshot.hot.length > 0 && <ol>{snapshot.hot.map((item, index) => <li key={item.keyword}>
              <button onClick={() => void search.search(item.keyword)}><span className={index < 3 ? 'hot-rank top' : 'hot-rank'}>{String(index + 1).padStart(2, '0')}</span><span>{item.label}</span></button>
            </li>)}</ol>}
            {search.hotLoading && !snapshot.hot.length && <div className="video-search-status" role="status">正在获取热搜…</div>}
            {search.hotError && <div className="video-search-error" role="alert"><span>{search.hotError}</span><button onClick={() => void search.loadHot()}>重试</button>{!account.eligible && <button onClick={login}>{account.profile ? '检查账号' : '登录'}</button>}</div>}
          </section><RecentSearches terms={snapshot.recent} onSearch={term => void search.search(term)} /></>}
          {showSuggestions && <div className="video-search-suggestions">
            {suggestions.length > 0 && <div id="video-search-suggestions" role="listbox" aria-label="搜索联想">{suggestions.map((term, index) => <button key={term} id={`video-suggestion-${index}`} role="option" aria-selected={index === activeSuggestion}
              onClick={() => void search.search(term)} onMouseEnter={() => setActiveSuggestion(index)}><Icon name="Search" size={16} /><span><SuggestionLabel term={term} query={draft} /></span><Icon name="CornerUpLeft" size={15} /></button>)}</div>}
            {search.suggesting && <div className="video-search-status subtle" role="status">正在获取联想…</div>}
            {search.suggestError && <div className="video-search-error" role="status">{search.suggestError}</div>}
          </div>}
          {searching && <div className="video-search-status" role="status"><Icon name="LoaderCircle" size={18} />正在搜索…</div>}
          {search.error && <div className="video-search-error" role="alert"><span>{search.error}</span><button onClick={() => void search.retry()}>重试</button>{!account.eligible && <button onClick={login}>{account.profile ? '检查账号' : '登录'}</button>}</div>}
          {mode === 'results' && playError && <div className="video-search-error" role="alert">{playError}</div>}
          {result && <section className="video-search-results" aria-label={`${result.keyword}的视频结果`} aria-busy={searching}>
            <div className="video-search-section-heading video-results-heading"><h2>视频</h2><span>{result.total.toLocaleString('zh-CN')} 个结果</span><button disabled={!!selecting} onClick={() => { search.clear(); input.current?.focus(); }}><Icon name="ArrowLeft" size={13} />热搜</button></div>
            <div className="video-results-grid">{result.videos.map(video => <VideoResultCard key={video.bvid} video={video} busy={selecting === video.bvid} disabled={searching || !!selecting} onPlay={() => void play(video.bvid)} />)}</div>
            {!result.videos.length && !searching && <div className="video-search-status">没有找到相关视频</div>}
            {result.pages > 1 && <nav className="video-search-pagination" aria-label="搜索结果分页">
              <IconButton icon="ChevronLeft" label="上一页" disabled={searching || !!selecting || result.page <= 1} onClick={() => void search.search(result.keyword, result.page - 1)} />
              <span aria-live="polite">{result.page} / {result.pages}</span>
              <IconButton icon="ChevronRight" label="下一页" disabled={searching || !!selecting || result.page >= result.pages} onClick={() => void search.search(result.keyword, result.page + 1)} />
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
