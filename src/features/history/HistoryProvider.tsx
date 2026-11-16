import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAccount } from '../account/AccountProvider';
import { biliRequest } from '../account/api';
import { emptyHistory, historyKey, type HistoryItem, type HistoryMode, type HistoryPage, type HistorySnapshot } from './types';
import { readHistory, writeHistory } from './storage';
import { HistoryPlaybackObserver } from './HistoryPlaybackObserver';

function useHistoryState() {
  const account = useAccount(), uid = account.profile?.uid || '';
  const [cache,setCache] = useState({ uid: '', value: emptyHistory() });
  const latest = useRef(cache); latest.current = cache;
  const currentUid = useRef(uid); currentUid.current = uid;
  const [view,setView] = useState<{ mode: HistoryMode; open: boolean; accountOpen: boolean }>({ mode: 'quick', open: false, accountOpen: false });
  const avatar = useRef<HTMLElement | null>(null), clock = useRef<HTMLElement | null>(null);
  const [loading,setLoading] = useState(false), [error,setError] = useState(''), [syncError,setSyncError] = useState('');
  const revision = useRef(0), activeRequest = useRef(0);
  const lastRequest = useRef({ keyword: '', append: false });
  const ready = !account.checking && !!uid && cache.uid === uid;
  const snapshot = cache.uid === uid ? cache.value : emptyHistory();
  const patch = useCallback((value: Partial<HistorySnapshot>) => setCache(old => old.uid === currentUid.current ? { ...old, value: { ...old.value, ...value } } : old), []);
  useEffect(() => {
    if (cache.uid === uid) return;
    writeHistory(cache.uid,cache.value); revision.current++; activeRequest.current = 0;
    setLoading(false); setError(''); setSyncError(''); setView(old => ({...old,open:false,accountOpen:false}));
    const next = { uid, value: readHistory(uid) }; latest.current = next; setCache(next);
  }, [uid,cache.uid]);
  useEffect(() => { const timer = setTimeout(() => writeHistory(cache.uid,cache.value),200); return () => clearTimeout(timer); }, [cache]);
  useEffect(() => {
    const flush = () => writeHistory(latest.current.uid,latest.current.value);
    window.addEventListener('beforeunload',flush);
    return () => { flush(); window.removeEventListener('beforeunload',flush); };
  }, []);
  async function load(keyword: string, append = false) {
    if (!ready || (append && activeRequest.current)) return;
    const token = ++revision.current, owner = uid, previous = latest.current.value;
    activeRequest.current = token; lastRequest.current = { keyword, append }; setLoading(true); setError('');
    try {
      const result = await biliRequest<HistoryPage>('historyPage',{ uid: owner, keyword, page: append ? previous.page + 1 : 1, cursor: append ? previous.cursor : null });
      if (token !== revision.current || currentUid.current !== owner) return;
      setCache(old => {
        if (old.uid !== owner) return old;
        const combined = append ? [...old.value.items,...result.items] : result.items;
        const unique = [...new Map(combined.map(item => [historyKey(item),item])).values()];
        return { uid: owner, value: { ...old.value, ...result, items: unique, keyword, loaded: true, scroll: append ? old.value.scroll : {quick:0,manager:0} } };
      });
    } catch (e) { if (token === revision.current && currentUid.current === owner) setError((e as Error).message); }
    finally { if (token === revision.current) { activeRequest.current = 0; setLoading(false); } }
  }
  useEffect(() => { if (view.open && ready && !snapshot.loaded && !activeRequest.current && !error) void load(snapshot.keyword); }, [view.open,ready,snapshot.loaded]);
  const close = () => setView(old => ({...old,open:false,accountOpen:false}));
  const toggleAccount = (anchor: HTMLElement) => {
    avatar.current = anchor;
    if (!account.profile) { close(); account.openLogin(); return; }
    setView(old => ({...old,open:false,accountOpen:!old.accountOpen}));
  };
  const toggleManager = (anchor?: HTMLElement) => {
    if (anchor) clock.current = anchor;
    setView(old => ({ mode:'manager',open:!(old.open && old.mode === 'manager'),accountOpen:false }));
  };
  const record = useCallback((owner: string, item: Pick<HistoryItem,'bvid'|'cid'>) => {
    if (owner !== currentUid.current) return;
    setCache(old => {
      const key = historyKey(item);
      if (old.uid !== owner || old.value.viewed[key]) return old;
      return { ...old, value: {...old.value,viewed:{...old.value.viewed,[key]:Date.now()}} };
    });
  }, []);
  const reportError = useCallback((owner: string, message: string) => { if (currentUid.current === owner) setSyncError(message); }, []);
  return { uid, ready, snapshot, patch, view, avatar, clock, loading, error, syncError, close, toggleAccount, toggleManager, record, reportError,
    openQuick: () => setView({ mode:'quick',open:true,accountOpen:true }),
    expand: () => setView({ mode:'manager',open:true,accountOpen:false }),
    search: () => load(snapshot.draft.trim()), more: () => load(snapshot.keyword,true),
    retry: () => load(lastRequest.current.keyword,lastRequest.current.append), refresh: () => load(snapshot.keyword),
    rememberScroll: (mode: HistoryMode, value: number) => { if (Math.abs(snapshot.scroll[mode] - value) > 1) patch({scroll:{...snapshot.scroll,[mode]:value}}); },
  };
}
const Context = createContext<ReturnType<typeof useHistoryState>>(null!);
export const useHistory = () => useContext(Context);
export function HistoryProvider({ children }: { children: ReactNode }) {
  const value = useHistoryState();
  return <Context.Provider value={value}>{children}<HistoryPlaybackObserver /></Context.Provider>;
}
