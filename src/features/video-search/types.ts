export type SearchVideo = {
  bvid: string; title: string; cover: string; author: string;
  duration: number; views: number; publishedAt: number;
};
export type HotKeyword = { keyword: string; label: string };
export type SearchPage = { keyword: string; page: number; pages: number; total: number; videos: SearchVideo[] };
export type SearchSnapshot = {
  mode: 'discovery' | 'suggestions' | 'results'; recent: string[];
  draft: string; result: SearchPage | null; scrollTop: number;
  hot: HotKeyword[]; suggestions: string[];
};
