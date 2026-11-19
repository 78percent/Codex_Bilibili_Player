import type { SearchOptions, SearchQuery } from './types';

export const defaultSearchOptions: SearchOptions = { order: 'totalrank', duration: 0, tids: 0 };

export function searchKey(query: SearchQuery) {
  return JSON.stringify([query.keyword, query.page, query.order, query.duration, query.tids]);
}

export function includesUploaders(query: SearchQuery) {
  return query.page === 1 && query.order === 'totalrank' && query.duration === 0 && query.tids === 0;
}
