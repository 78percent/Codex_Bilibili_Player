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
function optionalCount(value) {
  if (value === undefined || value === null || value === '') return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
}
function userId(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return '';
  const result = String(value ?? '');
  return /^[1-9]\d{0,23}$/.test(result) ? result : '';
}
function searchOptions(arg) {
  const order = arg?.order ?? 'totalrank', selectedDuration = Number(arg?.duration ?? 0), tids = Number(arg?.tids ?? 0);
  if (!['totalrank', 'click', 'pubdate', 'dm', 'stow'].includes(order)) throw new BiliError('搜索排序不可用', 'INPUT');
  if (!Number.isInteger(selectedDuration) || selectedDuration < 0 || selectedDuration > 4) throw new BiliError('时长筛选不可用', 'INPUT');
  if (!Number.isSafeInteger(tids) || tids < 0) throw new BiliError('分区筛选不可用', 'INPUT');
  return { order, duration: selectedDuration, tids };
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
      const term = keyword(typeof value === 'string' ? value : value?.keyword);
      const requested = Number(value?.count);
      const count = Number.isFinite(requested) ? Math.max(6, Math.min(20, Math.ceil(requested))) : 10;
      const data = await client.request('s.search.bilibili.com', '/main/suggest', {
        term, main_ver: 'v1', highlight: '', func: 'suggest', suggest_type: 'accurate',
        sub_type: 'tag', tag_num: count, userid: 0,
      }, undefined, 'result');
      if (!Array.isArray(data?.tag)) return [];
      return [...new Set(data.tag.map(item => plainText(item.value || item.name)).filter(Boolean))].slice(0, count);
    },
    searchVideos: async arg => {
      const term = keyword(arg?.keyword), page = Number(arg?.page ?? 1), options = searchOptions(arg);
      if (!Number.isInteger(page) || page < 1 || page > 1000) throw new BiliError('搜索页码不可用', 'INPUT');
      const data = await client.signed('/x/web-interface/wbi/search/type', {
        search_type: 'video', keyword: term, page, page_size: 20, ...options,
      }, true);
      if (!data || !Array.isArray(data.result) && Number(data.numResults) !== 0) throw new BiliError('B站未返回有效的搜索结果');
      const videos = (Array.isArray(data.result) ? data.result : []).filter(item => item?.bvid && !item.is_ad && !item.ad_info).map(item => ({
        bvid: item.bvid, title: plainText(item.title), author: plainText(item.author),
        authorId: userId(item.mid),
        cover: String(item.pic || '').replace(/^\/\//, 'https://').replace(/^http:/, 'https:'),
        duration: duration(item.duration), views: Number(item.play) || 0, publishedAt: Number(item.pubdate) || 0,
        danmaku: optionalCount(item.video_review) ?? undefined, favorites: optionalCount(item.favorites) ?? undefined,
        partition: plainText(item.typename) || undefined,
      }));
      return { keyword: term, page, ...options, pages: Math.max(1, Math.min(1000, Number(data.numPages) || 1)), total: Number(data.numResults) || 0, videos };
    },
    searchUploaders: async arg => {
      const term = keyword(arg?.keyword);
      const data = await client.signed('/x/web-interface/wbi/search/all/v2', { keyword: term }, true);
      if (!Array.isArray(data?.result)) throw new BiliError('B站未返回有效的相关UP主结果');
      const uploaders = [], seen = new Set();
      for (const module of data.result) {
        if (module?.result_type !== 'bili_user') continue;
        if (!Array.isArray(module.data)) throw new BiliError('B站未返回有效的相关UP主结果');
        for (const item of module.data) {
          const mid = userId(item?.mid), name = plainText(item?.uname);
          if (!mid || !name || seen.has(mid)) continue;
          seen.add(mid);
          uploaders.push({ mid, name, avatar: String(item.upic || '').replace(/^\/\//, 'https://').replace(/^http:/, 'https:'),
            sign: plainText(item.usign), followers: optionalCount(item.fans), videoCount: optionalCount(item.videos) });
          if (uploaders.length === 2) return uploaders;
        }
      }
      return uploaders;
    },
  };
}
module.exports = { createSearch };
