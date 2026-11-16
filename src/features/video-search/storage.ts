import type { SearchSnapshot } from './types';

export const emptySearch = (recent: string[] = []): SearchSnapshot => ({
  mode: 'discovery', recent, draft: '', result: null, scrollTop: 0, hot: [], suggestions: [],
});
const prefix = 'codex-bilibili-player:video-search-history:v2:';
const legacyPrefix = 'codex-bilibili-player:video-search:v1:';

function terms(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((term): term is string => typeof term === 'string')
    .map(term => term.trim().slice(0, 200)).filter(Boolean))].slice(0, 10);
}
export function rememberSearch(recent: string[], keyword: string): string[] {
  const term = keyword.trim();
  return recent[0] === term ? recent : terms([term, ...recent]);
}
export function persistRecent(account: string, recent: string[]) {
  if (!account) return;
  try { localStorage.setItem(prefix + account, JSON.stringify({ recent: terms(recent) })); }
  catch { /* The current session still retains its recent terms. */ }
}
export function restoreSearch(account: string): SearchSnapshot {
  let recent: string[] = [];
  try {
    const saved = localStorage.getItem(prefix + account);
    const legacy = localStorage.getItem(legacyPrefix + account);
    if (saved !== null) {
      try { recent = terms(JSON.parse(saved)?.recent); } catch { /* Discard malformed history. */ }
    } else if (legacy !== null) {
      // Only an actually submitted keyword migrates; drafts and results do not.
      try { recent = terms([JSON.parse(legacy)?.result?.keyword]); } catch { /* Discard malformed snapshots. */ }
    }
    if (legacy !== null) {
      localStorage.removeItem(legacyPrefix + account);
      persistRecent(account, recent);
    }
  } catch { /* Storage may be unavailable; do not prevent opening search. */ }
  return emptySearch(recent);
}
