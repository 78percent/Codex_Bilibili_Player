export type HistoryMode = 'quick' | 'manager';
export type HistoryItem = {
  bvid: string; cid: number; title: string; cover: string; author: string; authorId: string;
  duration: number; progress: number; viewedAt: number; part: string;
};
export type HistoryCursor = { max: number; view_at: number; business: string };
export type HistoryPage = { items: HistoryItem[]; cursor: HistoryCursor | null; page: number; more: boolean };
export type HistorySnapshot = HistoryPage & {
  draft: string; keyword: string; loaded: boolean; date: string; progress: string;
  scroll: Record<HistoryMode, number>; viewed: Record<string, number>;
};
export const historyKey = (item: Pick<HistoryItem, 'bvid' | 'cid'>) => `${item.bvid}:${item.cid}`;
export const emptyHistory = (): HistorySnapshot => ({ items: [], cursor: null, page: 1, more: false, draft: '', keyword: '', loaded: false, date: 'all', progress: 'all', scroll: { quick: 0, manager: 0 }, viewed: {} });
export function durationLabel(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return value >= 3600 ? `${Math.floor(value / 3600)}:${String(Math.floor(value / 60) % 60).padStart(2,'0')}:${String(value % 60).padStart(2,'0')}` : `${Math.floor(value / 60)}:${String(value % 60).padStart(2,'0')}`;
}
export function dayLabel(timestamp: number) {
  const date = new Date(timestamp * 1000), today = new Date(), yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return '今天';
  if (date.toDateString() === yesterday.toDateString()) return '昨天';
  return date.toLocaleDateString('zh-CN');
}
