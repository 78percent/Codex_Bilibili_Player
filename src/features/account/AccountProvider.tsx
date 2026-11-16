import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { biliRequest, type AccountSnapshot } from './api';
import { LoginDialog } from './LoginDialog';
type AccountContextValue = AccountSnapshot & {
  checking: boolean; error: string; eligible: boolean; loginOpen: boolean;
  openLogin: () => void; closeLogin: () => void; refresh: () => Promise<void>; logout: () => Promise<void>;
};
const Context = createContext<AccountContextValue>(null!);
export const useAccount = () => useContext(Context);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [snapshot,setSnapshot] = useState<AccountSnapshot>({ profile: null, persistenceError: '' });
  const [checking,setChecking] = useState(true), [error,setError] = useState(''), [loginOpen,setLoginOpen] = useState(false);
  const [confirmed,setConfirmed] = useState(false);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setChecking(true); setError(''); setConfirmed(false);
    try {
      const state = await biliRequest<AccountSnapshot>('account');
      if (current === generation.current) { setSnapshot(state); setConfirmed(true); if (state.profile) setLoginOpen(false); }
    } catch (e) { if (current === generation.current) setError((e as Error).message); }
    finally { if (current === generation.current) setChecking(false); }
  },[]);
  const logout = useCallback(async () => {
    generation.current++; setConfirmed(false); setChecking(true); setError('');
    try { setSnapshot(await biliRequest<AccountSnapshot>('logout')); }
    catch (e) { setError((e as Error).message); }
    finally { setChecking(false); }
  },[]);
  useEffect(() => {
    const unsubscribe = window.bilibili?.onAccount(state => {
      setSnapshot(state); setConfirmed(true); setError(''); setChecking(false);
      if (state.profile) setLoginOpen(false);
    });
    void refresh();
    return () => { generation.current++; unsubscribe?.(); };
  },[refresh]);
  const closeLogin = useCallback(() => setLoginOpen(false),[]);
  return <Context.Provider value={{ ...snapshot, checking, error, loginOpen, eligible: confirmed && !checking && snapshot.profile?.mobileVerified === true,
    openLogin: () => setLoginOpen(true), closeLogin, refresh, logout }}>
    {children}
    {loginOpen && <LoginDialog onClose={closeLogin} />}
  </Context.Provider>;
}
