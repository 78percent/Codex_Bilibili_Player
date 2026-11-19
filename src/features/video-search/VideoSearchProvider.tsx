import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { biliRequest } from '../account/api';
import { useAccount } from '../account/AccountProvider';
import { emptySearch, persistRecent, rememberSearch, restoreSearch } from './storage';
import type { HotKeyword, SearchOptions, SearchPage, SearchQuery, SearchSnapshot, SearchUploader } from './types';
import { useUploaderBrowser, useUploaderResource } from '../uploader/browser';
import { defaultSearchOptions, includesUploaders, searchKey } from './options';

function useSearchState() {
  const account = useAccount();
  const accountKey = account.profile?.uid || 'guest';
  const browser = useUploaderBrowser(accountKey);
  const [open, setOpen] = useState(false);
  const [cache, setCache] = useState({ key: '', value: emptySearch() });
  const [searching, setSearching] = useState(false), [error, setError] = useState('');
  const [hotLoading, setHotLoading] = useState(false), [hotError, setHotError] = useState('');
  const [suggesting, setSuggesting] = useState(false), [suggestError, setSuggestError] = useState('');
  const [composing, setComposing] = useState(false);
  const [suggestionCount, setSuggestionCount] = useState(6);
  const suggestionCache = useRef(new Map<string, { terms: string[]; expires: number }>());
  const suggestionRequests = useRef(new Map<string, Promise<string[]>>());
  const searchRevision = useRef(0), suggestRevision = useRef(0), hotRevision = useRef(0);
  const lastRequest = useRef<SearchQuery>({ ...defaultSearchOptions, keyword: '', page: 1 });
  const restoredRoute = useRef(0);
  const latest = useRef(cache); latest.current = cache;
  const owner = useRef(accountKey); owner.current = accountKey;
  const ready = !account.checking && cache.key === accountKey;
  const address = browser.current.kind === 'search' ? browser.current.address : null;
  const showUploaders = open && ready && browser.ready && cache.value.mode === 'results'
    && address?.mode === 'results' && address.draft === cache.value.draft && includesUploaders(address);
  const uploaders = useUploaderResource<SearchUploader[]>(browser.cache,
    `search-uploaders:${address ? searchKey(address) : ''}`, 'searchUploaders', { keyword: address?.keyword }, !!showUploaders);
  const patch = (value: Partial<SearchSnapshot>) => setCache(old => ({ ...old, value: { ...old.value, ...value } }));
  const suggestionKey = (key: string, term: string) => `${key}\u0000${term}\u0000${suggestionCount}`;
  function cachedSuggestions(key: string, term: string) {
    const id = suggestionKey(key, term), cached = suggestionCache.current.get(id);
    if (cached && cached.expires > Date.now()) return cached.terms;
    suggestionCache.current.delete(id);
    return undefined;
  }
  function requestSuggestions(key: string, term: string) {
    const id = suggestionKey(key, term), pending = suggestionRequests.current.get(id);
    if (pending) return pending;
    const request: Promise<string[]> = biliRequest<string[]>('searchSuggestions', { keyword: term, count: suggestionCount }).then(terms => {
      if (latest.current.key === key) {
        suggestionCache.current.delete(id);
        suggestionCache.current.set(id, { terms, expires: Date.now() + 60000 });
        if (suggestionCache.current.size > 40) suggestionCache.current.delete(suggestionCache.current.keys().next().value!);
      }
      return terms;
    }).finally(() => { if (suggestionRequests.current.get(id) === request) suggestionRequests.current.delete(id); });
    suggestionRequests.current.set(id, request);
    return request;
  }

  useEffect(() => {
    if (account.checking || cache.key === accountKey) return;
    searchRevision.current++; suggestRevision.current++; hotRevision.current++;
    suggestionCache.current.clear(); suggestionRequests.current.clear(); setComposing(false);
    setSearching(false); setSuggesting(false); setHotLoading(false);
    setError(''); setHotError(''); setSuggestError('');
    lastRequest.current = { ...defaultSearchOptions, keyword: '', page: 1 };
    setCache({ key: accountKey, value: restoreSearch(accountKey) });
  }, [account.checking, accountKey, cache.key]);

  async function loadHot() {
    if (!ready) return;
    const revision = ++hotRevision.current, key = cache.key;
    setHotLoading(true); setHotError('');
    try {
      const hot = await biliRequest<HotKeyword[]>('hotSearch');
      if (revision === hotRevision.current && latest.current.key === key) patch({ hot });
    } catch (e) { if (revision === hotRevision.current) setHotError((e as Error).message); }
    finally { if (revision === hotRevision.current) setHotLoading(false); }
  }
  useEffect(() => {
    if (open && ready && browser.current.kind === 'search' && !cache.value.hot.length) void loadHot();
  }, [open, ready, cache.key, browser.current.kind]);

  useEffect(() => {
    const revision = ++suggestRevision.current;
    setSuggesting(false); setSuggestError('');
    const term = cache.value.draft.trim();
    if (!open || !ready || browser.current.kind !== 'search' || searching || !term || cache.value.mode !== 'suggestions') return;
    const cached = cachedSuggestions(cache.key, term);
    if (cached) { patch({ suggestions: cached }); return; }
    setSuggesting(true);
    if (composing) return;
    const timer = setTimeout(async () => {
      try {
        const suggestions = await requestSuggestions(cache.key, term);
        if (revision === suggestRevision.current) patch({ suggestions });
      } catch (e) { if (revision === suggestRevision.current) { patch({ suggestions: [] }); setSuggestError((e as Error).message); } }
      finally { if (revision === suggestRevision.current) setSuggesting(false); }
    }, 100);
    return () => { clearTimeout(timer); suggestRevision.current++; };
  }, [open, ready, browser.current.kind, searching, composing, suggestionCount, cache.key, cache.value.draft, cache.value.mode]);

  function setDraft(draft: string) {
    searchRevision.current++; suggestRevision.current++;
    const term = draft.trim(), cached = cachedSuggestions(cache.key, term);
    setSearching(false); setSuggesting(!!term && !cached); setError(''); setSuggestError('');
    patch({ draft, mode: term ? 'suggestions' : 'discovery', suggestions: term ? cached ?? cache.value.suggestions : [], scrollTop: 0 });
    if (browser.current.kind !== 'search' || browser.current.address?.mode !== 'results') browser.remember(0, '');
  }
  async function fetchSearch(query: SearchQuery, scrollTop = 0, remember = true) {
    const term = query.keyword.trim();
    if (!term || !ready) return;
    const revision = ++searchRevision.current, key = cache.key;
    const request = { ...query, keyword: term };
    lastRequest.current = request;
    suggestRevision.current++;
    const recent = remember ? rememberSearch(cache.value.recent, term) : cache.value.recent;
    if (recent !== cache.value.recent) persistRecent(key, recent);
    const previous = cache.value.result;
    patch({ mode: 'results', draft: term, recent, options: { order: query.order, duration: query.duration, tids: query.tids },
      result: previous && searchKey(previous) === searchKey(request) ? previous : null, scrollTop, suggestions: [] });
    setSearching(true); setError(''); setSuggestError(''); setSuggesting(false);
    try {
      const result = await biliRequest<SearchPage>('searchVideos', request);
      if (revision === searchRevision.current && latest.current.key === key && owner.current === key) {
        browser.cache.saveSearch(result);
        patch({ result, scrollTop, suggestions: [] });
      }
    } catch (e) { if (revision === searchRevision.current && owner.current === key) setError((e as Error).message); }
    finally { if (revision === searchRevision.current && owner.current === key) setSearching(false); }
  }
  async function navigateSearch(query: SearchQuery, filtersOpen = cache.value.filtersOpen) {
    const term = query.keyword.trim();
    if (!term || !ready) return;
    if (cache.value.result) browser.cache.saveSearch(cache.value.result);
    browser.captureSearch(cache.value);
    restoredRoute.current = browser.navigate({ kind: 'search', address: { ...query, mode: 'results', draft: term, keyword: term, filtersOpen } });
    patch({ filtersOpen });
    await fetchSearch({ ...query, keyword: term });
  }
  function search(keyword: string) {
    return navigateSearch({ ...defaultSearchOptions, keyword, page: 1 }, false);
  }
  function changeOptions(options: SearchOptions) {
    if (!address || address.mode !== 'results') return;
    return navigateSearch({ ...options, keyword: address.keyword, page: 1 });
  }
  function goToPage(page: number) {
    if (!address || address.mode !== 'results') return;
    return navigateSearch({ ...cache.value.options, keyword: address.keyword, page });
  }
  function toggleFilters() {
    const filtersOpen = !cache.value.filtersOpen;
    patch({ filtersOpen });
    browser.captureSearch({ ...cache.value, filtersOpen });
  }
  useLayoutEffect(() => {
    if (!ready || !browser.ready || browser.current.id === restoredRoute.current) return;
    restoredRoute.current = browser.current.id;
    searchRevision.current++; suggestRevision.current++;
    setSearching(false); setSuggesting(false); setError(''); setSuggestError(''); setComposing(false);
    const route = browser.current;
    if (route.kind !== 'search') return;
    const address = route.address;
    if (!address) {
      patch({ mode: 'discovery', draft: '', result: null, scrollTop: route.scrollTop, suggestions: [], options: { ...defaultSearchOptions }, filtersOpen: false });
      return;
    }
    const query = { keyword: address.keyword, page: address.page, order: address.order, duration: address.duration, tids: address.tids };
    const result = address.keyword ? browser.cache.getSearch(query) : undefined;
    lastRequest.current = query;
    patch({ mode: address.mode, draft: address.draft, result: result ?? null, scrollTop: route.scrollTop, suggestions: [],
      options: { order: address.order, duration: address.duration, tids: address.tids }, filtersOpen: address.filtersOpen });
    if (address.mode === 'results' && address.keyword && !result) void fetchSearch(query, route.scrollTop, false);
  }, [browser.current.id, browser.ready, ready]);
  function close() {
    setComposing(false);
    setOpen(false);
  }
  function clear() {
    searchRevision.current++; suggestRevision.current++;
    setComposing(false);
    setSearching(false); setSuggesting(false); setError(''); setSuggestError('');
    patch({ mode: 'discovery', draft: '', result: null, suggestions: [], scrollTop: 0, options: { ...defaultSearchOptions }, filtersOpen: false });
    if (browser.current.kind !== 'search' || browser.current.address?.mode !== 'results') browser.remember(0, '');
  }
  return { open, setOpen, close, ready, browser, snapshot: cache.value, searching, error, hotLoading, hotError,
    suggesting, suggestError, setDraft, setComposing, setSuggestionCount, search, changeOptions, goToPage, toggleFilters, uploaders, showUploaders,
    loadHot, clear, retry: () => fetchSearch(lastRequest.current, browser.current.scrollTop, false),
    setScrollTop: (scrollTop: number) => patch({ scrollTop }) };
}
const Context = createContext<ReturnType<typeof useSearchState>>(null!);
export const useVideoSearch = () => useContext(Context);
export function VideoSearchProvider({ children }: { children: ReactNode }) {
  const value = useSearchState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
