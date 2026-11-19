import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { biliRequest } from '../account/api';
import type { UploaderCollection, UploaderTab } from './types';
import type { SearchPage, SearchQuery, SearchSnapshot } from '../video-search/types';
import { searchKey } from '../video-search/options';

export type UploaderTarget = { mid?: string; bvid?: string; name?: string };
export type UploaderRoute =
  | { kind: 'profile'; target: UploaderTarget; tab: UploaderTab; page: number; order: 'latest' | 'popular'; offset: string }
  | { kind: 'people'; target: UploaderTarget; relation: 'following' | 'followers'; page: number }
  | { kind: 'collection'; target: UploaderTarget; collection: UploaderCollection; page: number };
export type SearchAddress = SearchQuery & { mode: SearchSnapshot['mode']; draft: string; filtersOpen: boolean };
type Route = { kind: 'search'; address: SearchAddress | null } | UploaderRoute;
export type BrowserEntry = Route & { id: number; scrollTop: number; focusKey: string };
type Resource = { data?: unknown; loading: boolean; error: string };
const empty: Resource = { loading: false, error: '' };

// Page bodies remain in this bounded session cache; history only keeps addresses.
export class UploaderCache {
  private entries = new Map<string, Resource>();
  private listeners = new Set<() => void>();
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  get = (key: string): Resource => {
    const value = this.entries.get(key);
    if (value) { this.entries.delete(key); this.entries.set(key, value); }
    return value ?? empty;
  };
  private emit() { this.listeners.forEach(listener => listener()); }
  private put(key: string, value: Resource) {
    this.entries.delete(key); this.entries.set(key, value);
    while (this.entries.size > 12) this.entries.delete(this.entries.keys().next().value!);
    this.emit();
  }
  async load(key: string, operation: string, arg: unknown, force = false) {
    const previous = this.get(key);
    if (previous.loading || (!force && (previous.data !== undefined || previous.error))) return;
    const pending: Resource = { data: previous.data, loading: true, error: '' };
    this.put(key, pending);
    try {
      const data = await biliRequest(operation, arg);
      if (this.entries.get(key) === pending) this.put(key, { data, loading: false, error: '' });
    } catch (e) {
      if (this.entries.get(key) === pending) this.put(key, { data: previous.data, loading: false, error: (e as Error).message });
    }
  }
  update<T>(prefix: string, update: (data: T) => T) {
    for (const [key, entry] of this.entries) {
      if (key.startsWith(prefix) && entry.data !== undefined) {
        const data = update(entry.data as T);
        if (data !== entry.data) this.entries.set(key, { data, loading: false, error: '' });
      }
    }
    this.emit();
  }
  invalidate(prefix: string) {
    for (const key of this.entries.keys()) if (key.startsWith(prefix)) this.entries.delete(key);
    this.emit();
  }
  saveSearch(page: SearchPage) { this.put(`search:${searchKey(page)}`, { data: page, loading: false, error: '' }); }
  getSearch(query: SearchQuery) { return this.get(`search:${searchKey(query)}`).data as SearchPage | undefined; }
}

export function useUploaderResource<T>(cache: UploaderCache, key: string, operation: string, arg: unknown, enabled = true) {
  const state = useSyncExternalStore(cache.subscribe, () => enabled ? cache.get(key) : empty);
  const args = useRef(arg); args.current = arg;
  useEffect(() => {
    if (enabled && state === empty) void cache.load(key, operation, args.current);
  }, [cache, key, operation, enabled, state]);
  return { data: state.data as T | undefined, loading: enabled && (state === empty || state.loading), error: state.error,
    retry: () => void cache.load(key, operation, args.current, true) };
}

export function useUploaderBrowser(accountKey: string) {
  const nextId = useRef(1);
  const fresh = (): BrowserEntry => ({ kind: 'search', address: null, id: nextId.current++, scrollTop: 0, focusKey: '' });
  const [history, setHistory] = useState(() => ({ owner: accountKey, entries: [fresh()], index: 0 }));
  const lastSearch = useRef<{ owner: string; entry: BrowserEntry } | null>(null);
  const cache = useMemo(() => new UploaderCache(), [accountKey]);
  useEffect(() => {
    if (history.owner !== accountKey) setHistory({ owner: accountKey, entries: [fresh()], index: 0 });
  }, [accountKey, history.owner]);
  const current: BrowserEntry = history.owner === accountKey ? history.entries[history.index] : { kind: 'search', address: null, id: 0, scrollTop: 0, focusKey: '' };
  function navigate(route: Route, position?: { scrollTop: number; focusKey: string }) {
    const id = nextId.current++;
    const entry: BrowserEntry = { ...route, id, scrollTop: position?.scrollTop ?? 0, focusKey: position?.focusKey ?? (route.kind === 'profile' ? `tab-${route.tab}` : '') };
    if (route.kind === 'search') lastSearch.current = { owner: accountKey, entry };
    setHistory(old => {
      const entries = [...old.entries.slice(0, old.index + 1), entry].slice(-24);
      return { owner: accountKey, entries, index: entries.length - 1 };
    });
    return id;
  }
  function openProfile(target: UploaderTarget) {
    navigate({ kind: 'profile', target, tab: 'home', page: 1, order: 'latest', offset: '' });
  }
  return { cache, current, ready: history.owner === accountKey,
    canBack: history.owner === accountKey && history.index > 0, canForward: history.owner === accountKey && history.index < history.entries.length - 1,
    navigate, openProfile,
    travel: (step: number) => setHistory(old => ({ ...old, index: Math.max(0, Math.min(old.entries.length - 1, old.index + step)) })),
    search: () => {
      if (current.kind === 'search') return;
      const last = history.entries.slice(0, history.index + 1).reverse().find(entry => entry.kind === 'search')
        ?? (lastSearch.current?.owner === accountKey ? lastSearch.current.entry : undefined);
      navigate({ kind: 'search', address: last?.kind === 'search' ? last.address : null }, last);
    },
    captureSearch: (snapshot: SearchSnapshot) => {
      if (current.kind !== 'search') return;
      // Editing the next query must not rewrite the last submitted address.
      if (current.address?.mode === 'results' && snapshot.mode !== 'results') return;
      const requested = snapshot.mode === 'results' && current.address?.mode === 'results' && current.address.draft === snapshot.draft ? current.address : snapshot.result;
      current.address = { ...snapshot.options, mode: snapshot.mode, draft: snapshot.draft,
        keyword: requested?.keyword || '', page: requested?.page || 1, filtersOpen: snapshot.filtersOpen };
      lastSearch.current = { owner: accountKey, entry: current };
      if (snapshot.result) cache.saveSearch(snapshot.result);
    },
    remember: (scrollTop: number, focusKey?: string) => {
      current.scrollTop = scrollTop; if (focusKey !== undefined) current.focusKey = focusKey;
      if (current.kind === 'search') lastSearch.current = { owner: accountKey, entry: current };
    },
  };
}
export type UploaderBrowser = ReturnType<typeof useUploaderBrowser>;
