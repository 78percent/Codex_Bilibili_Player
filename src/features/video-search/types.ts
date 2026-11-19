export type SearchVideo = {
  bvid: string; title: string; cover: string; author: string; authorId: string;
  duration: number; views: number; publishedAt: number;
  danmaku?: number; favorites?: number; partition?: string;
};
export type SearchOptions = {
  order: 'totalrank' | 'click' | 'pubdate' | 'dm' | 'stow';
  duration: 0 | 1 | 2 | 3 | 4; tids: number;
};
export type SearchQuery = SearchOptions & { keyword: string; page: number };
export type SearchUploader = {
  mid: string; name: string; avatar: string; sign: string;
  followers: number | null; videoCount: number | null;
};
export type HotKeyword = { keyword: string; label: string };
export type SearchPage = SearchQuery & { pages: number; total: number; videos: SearchVideo[] };
export type SearchSnapshot = {
  mode: 'discovery' | 'suggestions' | 'results'; recent: string[];
  draft: string; result: SearchPage | null; scrollTop: number;
  hot: HotKeyword[]; suggestions: string[];
  options: SearchOptions; filtersOpen: boolean;
};
