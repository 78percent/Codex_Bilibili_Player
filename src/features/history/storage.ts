import { emptyHistory, type HistorySnapshot } from './types';
const key = (uid: string) => `bilibili-watch-history-v1:${uid}`;
export function readHistory(uid: string): HistorySnapshot {
  if (!uid) return emptyHistory();
  try {
    const data = JSON.parse(localStorage.getItem(key(uid)) || 'null');
    if (!data || !Array.isArray(data.items)) return emptyHistory();
    const base = emptyHistory();
    return { ...base, ...data, items: data.items.filter((row: any) => row && typeof row.bvid === 'string' && Number.isFinite(row.cid) && typeof row.title === 'string' && Number.isFinite(row.viewedAt)),
      // Retain the visible cache, but revalidate against Bilibili after restarting.
      loaded: false, page: 1, cursor: null, more: false,
      draft: typeof data.draft === 'string' ? data.draft : '', keyword: typeof data.keyword === 'string' ? data.keyword : '',
      date: ['all','today','yesterday'].includes(data.date) ? data.date : 'all', progress: ['all','unfinished','finished'].includes(data.progress) ? data.progress : 'all',
      scroll: { quick: Math.max(0, Number(data.scroll?.quick) || 0), manager: Math.max(0, Number(data.scroll?.manager) || 0) },
      viewed: data.viewed && typeof data.viewed === 'object' && !Array.isArray(data.viewed) ? data.viewed : {},
    };
  } catch { return emptyHistory(); }
}
export function writeHistory(uid: string, snapshot: HistorySnapshot) {
  if (!uid) return;
  try { localStorage.setItem(key(uid), JSON.stringify(snapshot)); } catch { /* Keep this session's retained results if storage is unavailable. */ }
}
