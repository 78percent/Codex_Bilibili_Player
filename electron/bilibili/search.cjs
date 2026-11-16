const { BiliError } = require('./client.cjs');

function plainText(value) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return String(value || '').replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, key) => {
    if (key[0] !== '#') return entities[key.toLowerCase()] || match;
    const code = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}
function keyword(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) throw new BiliError('请输入不超过200字的搜索词', 'INPUT');
  return value.trim();
}
function duration(value) {
  if (typeof value === 'number') return Math.max(0, value);
  return String(value || '0').split(':').reduce((total, part) => total * 60 + (Number(part) || 0), 0);
}
function createSearch(client) {
  return {
    hotSearch: async () => {
      const data = await client.signed('/x/web-interface/wbi/search/square', { limit: 10, platform: 'web' }, true);
      if (!Array.isArray(data?.trending?.list)) throw new BiliError('暂时无法获取 B站热搜');
      return data.trending.list.filter(item => item.keyword).slice(0, 10).map(item => ({
        keyword: plainText(item.keyword), label: plainText(item.show_name || item.keyword),
      }));
    },
    searchSuggestions: async value => {
      const data = await client.request('s.search.bilibili.com', '/main/suggest', {
        term: keyword(value), main_ver: 'v1', highlight: '', func: 'suggest', suggest_type: 'accurate',
        sub_type: 'tag', tag_num: 6, userid: 0,
      }, undefined, 'result');
      if (!Array.isArray(data?.tag)) return [];
      return [...new Set(data.tag.map(item => plainText(item.value || item.name)).filter(Boolean))].slice(0, 6);
    },
    searchVideos: async arg => {
      const term = keyword(arg?.keyword), page = Number(arg?.page || 1);
      if (!Number.isInteger(page) || page < 1 || page > 1000) throw new BiliError('搜索页码不可用', 'INPUT');
      const data = await client.signed('/x/web-interface/wbi/search/type', {
        search_type: 'video', keyword: term, page, page_size: 20, order: 'totalrank',
      }, true);
      if (!data || !Array.isArray(data.result) && Number(data.numResults) !== 0) throw new BiliError('B站未返回有效的搜索结果');
      const videos = (data.result || []).filter(item => item.bvid && !item.is_ad && !item.ad_info).map(item => ({
        bvid: item.bvid, title: plainText(item.title), author: plainText(item.author),
        cover: String(item.pic || '').replace(/^\/\//, 'https://').replace(/^http:/, 'https:'),
        duration: duration(item.duration), views: Number(item.play) || 0, publishedAt: Number(item.pubdate) || 0,
      }));
      return { keyword: term, page, pages: Math.max(1, Math.min(1000, Number(data.numPages) || 1)), total: Number(data.numResults) || 0, videos };
    },
  };
}
module.exports = { createSearch };
