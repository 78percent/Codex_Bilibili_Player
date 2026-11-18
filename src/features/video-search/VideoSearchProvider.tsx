import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { biliRequest } from '../account/api';
import { useAccount } from '../account/AccountProvider';
import { emptySearch, persistRecent, rememberSearch, restoreSearch } from './storage';
import type { HotKeyword, SearchPage, SearchSnapshot } from './types';

function useSearchState() {
  const account = useAccount();
  const accountKey = account.profile?.uid || 'guest';
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
  const lastRequest = useRef({ keyword: '', page: 1 });
  const latest = useRef(cache); latest.current = cache;
  const ready = !account.checking && cache.key === accountKey;
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
    lastRequest.current = { keyword: '', page: 1 };
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
    if (open && ready && !cache.value.hot.length) void loadHot();
  }, [open, ready, cache.key]);

  useEffect(() => {
    const revision = ++suggestRevision.current;
    setSuggesting(false); setSuggestError('');
    const term = cache.value.draft.trim();
    if (!open || !ready || searching || !term || cache.value.mode !== 'suggestions') return;
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
  }, [open, ready, searching, composing, suggestionCount, cache.key, cache.value.draft, cache.value.mode]);

  function setDraft(draft: string) {
    searchRevision.current++; suggestRevision.current++;
    const term = draft.trim(), cached = cachedSuggestions(cache.key, term);
    setSearching(false); setSuggesting(!!term && !cached); setError(''); setSuggestError('');
    patch({ draft, mode: term ? 'suggestions' : 'discovery', suggestions: term ? cached ?? cache.value.suggestions : [], scrollTop: 0 });
  }
  async function search(keyword: string, page = 1) {
    const term = keyword.trim();
    if (!term || !ready) return;
    const revision = ++searchRevision.current, key = cache.key;
    lastRequest.current = { keyword: term, page };
    suggestRevision.current++;
    const recent = rememberSearch(cache.value.recent, term);
    if (recent !== cache.value.recent) persistRecent(key, recent);
    patch({ mode: 'results', draft: term, recent, result: cache.value.result?.keyword === term ? cache.value.result : null, suggestions: [] });
    setSearching(true); setError(''); setSuggestError(''); setSuggesting(false);
    try {
      const result = await biliRequest<SearchPage>('searchVideos', { keyword: term, page });
      if (revision === searchRevision.current && latest.current.key === key) patch({ result, scrollTop: 0, suggestions: [] });
    } catch (e) { if (revision === searchRevision.current) setError((e as Error).message); }
    finally { if (revision === searchRevision.current) setSearching(false); }
  }
  function close() {
    setComposing(false);
    setOpen(false);
  }
  function clear() {
    searchRevision.current++; suggestRevision.current++;
    setComposing(false);
    setSearching(false); setSuggesting(false); setError(''); setSuggestError('');
    patch({ mode: 'discovery', draft: '', result: null, suggestions: [], scrollTop: 0 });
  }
  return { open, setOpen, close, ready, snapshot: cache.value, searching, error, hotLoading, hotError,
    suggesting, suggestError, setDraft, setComposing, setSuggestionCount, search, loadHot, clear, retry: () => search(lastRequest.current.keyword, lastRequest.current.page),
    setScrollTop: (scrollTop: number) => patch({ scrollTop }) };
}
const Context = createContext<ReturnType<typeof useSearchState>>(null!);
export const useVideoSearch = () => useContext(Context);
export function VideoSearchProvider({ children }: { children: ReactNode }) {
  const value = useSearchState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
