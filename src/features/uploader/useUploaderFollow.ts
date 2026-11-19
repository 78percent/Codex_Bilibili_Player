import { useEffect, useRef, useState } from 'react';
import { biliRequest } from '../account/api';
import type { UploaderActions } from './UploaderShared';
import type { UploaderProfile } from './types';

export function useUploaderFollow(profile: UploaderProfile | undefined, actions: UploaderActions) {
  const [following, setFollowing] = useState(false), [error, setError] = useState('');
  const locked = useRef(false), alive = useRef(true), currentAccount = useRef(actions.uid);
  currentAccount.current = actions.uid;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function follow() {
    if (!actions.eligible) { actions.onLogin(); return; }
    if (locked.current || !profile || profile.followed === null || profile.isSelf) return;
    const owner = actions.uid;
    locked.current = true; setFollowing(true); setError('');
    try {
      const result = await biliRequest<{ followed: boolean }>('uploaderFollow', { mid: profile.mid, follow: !profile.followed, uid: owner });
      const change = result.followed === profile.followed ? 0 : result.followed ? 1 : -1;
      actions.browser.cache.update<UploaderProfile>('profile:', item => item.mid === profile.mid ? { ...item, followed: result.followed,
        followers: item.followers === null ? null : Math.max(0, item.followers + (result.followed === item.followed ? 0 : change)) }
        : item.mid === owner ? { ...item, following: item.following === null ? null : Math.max(0, item.following + change) } : item);
      actions.browser.cache.invalidate(`people:${profile.mid}:followers:`);
      actions.browser.cache.invalidate(`people:${owner}:following:`);
    } catch (e) { if (alive.current && currentAccount.current === owner) setError((e as Error).message); }
    finally { locked.current = false; if (alive.current && currentAccount.current === owner) setFollowing(false); }
  }
  return { following, error, follow };
}
