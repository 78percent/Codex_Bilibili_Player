export type Profile = { uid: string; name: string; avatar: string; membership: string; mobileVerified: boolean | null };
export type AccountSnapshot = { profile: Profile | null; persistenceError: string };
export type BiliFailure = { message: string; code: string };
declare global {
  interface Window {
    bilibili?: {
      request: (operation: string, arg?: unknown) => Promise<{ ok: true; data: unknown } | { ok: false; error: BiliFailure }>;
      onAccount: (callback: (state: AccountSnapshot) => void) => () => void;
    };
  }
}
export async function biliRequest<T>(operation: string, arg?: unknown): Promise<T> {
  if (!window.bilibili) throw new Error('请在桌面应用中使用 B 站功能');
  const result = await window.bilibili.request(operation,arg);
  if (!result.ok) throw Object.assign(new Error(result.error.message), { code: result.error.code });
  return result.data as T;
}
