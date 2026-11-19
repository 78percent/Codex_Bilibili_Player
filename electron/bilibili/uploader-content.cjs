const { BiliError } = require('./client.cjs');
const { PAGE_SIZE, optionalId, id, pageNumber, count, pagination, imageUrl, summary, video } = require('./uploader-data.cjs');

function dynamicContent(item) {
  const author = item?.modules?.module_author || {};
  const content = item?.modules?.module_dynamic || {}, major = content.major || {};
  const opus = major.opus;
  const text = opus
    ? [opus.title, opus.summary?.text].filter(Boolean).join('\n')
    : String(content.desc?.text ?? major.article?.title ?? major.common?.title ?? major.none?.tips ?? '');
  const pictures = opus?.pics ?? major.draw?.items ?? [];
  return {
    author: summary(author), text,
    images: Array.isArray(pictures) ? pictures.map(item => imageUrl(item.url ?? item.src)).filter(Boolean) : [],
    video: major.archive ? video({ ...major.archive, pubdate: author.pub_ts }) : null,
  };
}
function dynamic(item) {
  const dynamicId = optionalId(item.id_str);
  if (!dynamicId) return null;
  const content = dynamicContent(item), original = item.orig ? dynamicContent(item.orig) : null;
  const stat = item.modules?.module_stat || {}, author = item.modules?.module_author || {};
  const commentId = optionalId(item.basic?.comment_id_str), commentType = Number(item.basic?.comment_type);
  return {
    id: dynamicId, ...content, publishedAt: String(author.pub_time || ''),
    original: original ? { ...original, author: original.author.name } : null,
    likes: count(stat.like?.count) ?? 0,
    liked: !stat.like?.forbidden && typeof stat.like?.status === 'boolean' ? stat.like.status : null,
    comments: count(stat.comment?.count) ?? 0,
    commentId: stat.comment?.forbidden ? '' : commentId,
    commentType: Number.isSafeInteger(commentType) && commentType > 0 ? commentType : 0,
    kind: String(item.type || ''),
  };
}

function createUploaderContent(client) {
  return {
    uploaderVideos: async (arg = {}) => {
      const mid = id(arg.mid), page = pageNumber(arg.page);
      if (!['latest', 'popular'].includes(arg.order)) throw new BiliError('投稿排序不可用', 'INPUT');
      const data = await client.signed('/x/space/wbi/arc/search', { mid, pn: page, ps: PAGE_SIZE, order: arg.order === 'popular' ? 'click' : 'pubdate', tid: 0 }, true);
      if (!Array.isArray(data?.list?.vlist)) throw new BiliError('B站未返回有效的投稿列表');
      return { ...pagination(data.page?.count, page, data.page?.ps ?? PAGE_SIZE), videos: data.list.vlist.map(video).filter(Boolean) };
    },
    uploaderDynamics: async (arg = {}) => {
      const mid = id(arg.mid);
      const offset = arg.offset === undefined || arg.offset === '' ? '' : id(arg.offset, '动态分页');
      const data = await client.signed('/x/polymer/web-dynamic/v1/feed/space', {
        host_mid: mid, offset, timezone_offset: -480, platform: 'web', features: 'itemOpusStyle',
      }, true);
      if (!Array.isArray(data?.items) || typeof data.has_more !== 'boolean') throw new BiliError('B站未返回有效的动态列表');
      const next = optionalId(data.offset);
      if (data.has_more && (!next || next === offset)) throw new BiliError('B站未返回有效的动态分页');
      return { items: data.items.map(dynamic).filter(Boolean), offset: next, more: data.has_more };
    },
    uploaderCollections: async (arg = {}) => {
      const mid = id(arg.mid), page = pageNumber(arg.page);
      const data = await client.signed('/x/polymer/web-space/seasons_series_list', { mid, page_num: page, page_size: PAGE_SIZE }, true);
      const lists = data?.items_lists;
      if (!Array.isArray(lists?.seasons_list) || !Array.isArray(lists?.series_list)) throw new BiliError('B站未返回有效的合集列表');
      const items = [['season', lists.seasons_list], ['series', lists.series_list]].flatMap(([kind, rows]) => rows.map(row => {
        const meta = row.meta || {}, collectionId = optionalId(kind === 'season' ? meta.season_id : meta.series_id);
        if (!collectionId) return null;
        return { id: collectionId, kind, title: String(meta.name || ''), cover: imageUrl(meta.cover) || imageUrl(row.archives?.[0]?.pic), count: count(meta.total) ?? 0 };
      }).filter(Boolean));
      return { ...pagination(lists.page?.total, page, lists.page?.page_size ?? PAGE_SIZE), items };
    },
    uploaderCollectionVideos: async (arg = {}) => {
      const mid = id(arg.mid), collectionId = id(arg.id, '合集'), page = pageNumber(arg.page);
      if (!['season', 'series'].includes(arg.kind)) throw new BiliError('合集类型不可用', 'INPUT');
      const season = arg.kind === 'season';
      const data = season
        ? await client.signed('/x/polymer/web-space/seasons_archives_list', { mid, season_id: collectionId, page_num: page, page_size: PAGE_SIZE, sort_reverse: false }, true)
        : await client.request('api.bilibili.com', '/x/series/archives', { mid, series_id: collectionId, pn: page, ps: PAGE_SIZE, only_normal: true, sort: 'desc' });
      if (!Array.isArray(data?.archives)) throw new BiliError('B站未返回有效的合集视频');
      return { ...pagination(data.page?.total, page, (season ? data.page?.page_size : data.page?.size) ?? PAGE_SIZE), videos: data.archives.map(video).filter(Boolean) };
    },
    uploaderComments: async (arg = {}) => {
      const oid = id(arg.oid, '评论区'), type = Number(arg.type), page = pageNumber(arg.next || 1);
      if (!Number.isSafeInteger(type) || type < 1 || type > 1000) throw new BiliError('评论区类型不可用', 'INPUT');
      const data = await client.request('api.bilibili.com', '/x/v2/reply', { oid, type, pn: page, ps: PAGE_SIZE, sort: 1, nohot: 1 });
      const paging = pagination(data?.page?.count, page, data?.page?.size ?? PAGE_SIZE);
      if (data.replies !== null && !Array.isArray(data.replies)) throw new BiliError('B站未返回有效的评论列表');
      const items = (data.replies || []).map(row => ({
        id: optionalId(row.rpid_str ?? row.rpid), author: summary(row.member),
        message: String(row.content?.message || ''), likes: count(row.like) ?? 0, createdAt: count(row.ctime) ?? 0,
      })).filter(row => row.id);
      return { items, next: page + 1, more: page < paging.pages };
    },
  };
}

module.exports = { createUploaderContent };
