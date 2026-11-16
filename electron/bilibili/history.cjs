const { BiliError } = require('./client.cjs');

function normalize(row) {
  const history = row.history || {};
  const bvid = history.bvid || row.bvid;
  if (!/^BV[0-9A-Za-z]{10}$/.test(bvid || '') || (history.business && history.business !== 'archive')) return null;
  return {
    bvid, cid: Number(history.cid || row.cid) || 0,
    title: String(row.title || ''), cover: String(row.cover || row.pic || '').replace(/^http:/, 'https:'),
    author: String(row.author_name || row.author || ''), authorId: String(row.author_mid || row.mid || ''),
    duration: Math.max(0, Number(row.duration) || 0), progress: Number(row.progress) || 0,
    viewedAt: Number(row.view_at) || 0, part: String(history.part || ''),
  };
}

function createHistory(client, account, getSelected) {
  let heartbeatQueue = Promise.resolve();
  async function historyPage(arg = {}) {
    await account.requireBound();
    const uid = account.snapshot().profile?.uid;
    if (!uid || String(arg.uid) !== String(uid)) throw new BiliError('账号已切换，请重新打开观看记录', 'CANCELLED');
    const keyword = typeof arg.keyword === 'string' ? arg.keyword.trim().slice(0, 200) : '';
    const page = Math.max(1, Math.floor(Number(arg.page) || 1));
    const cursor = arg.cursor || {};
    const params = keyword ? { keyword, pn: page, ps: 30, business: 'archive' } : {
      type: 'archive', ps: 30, max: Number(cursor.max) || 0, view_at: Number(cursor.view_at) || 0,
      business: cursor.business === 'archive' ? 'archive' : '',
    };
    const data = await client.request('api.bilibili.com', keyword ? '/x/web-interface/history/search' : '/x/web-interface/history/cursor', params);
    if (String(account.snapshot().profile?.uid) !== String(uid)) throw new BiliError('账号已切换', 'CANCELLED');
    if (!Array.isArray(data?.list)) throw new BiliError('B 站历史记录响应暂不可用');
    const totalValue = data.page?.total ?? data.total;
    const total = Number.isFinite(Number(totalValue)) && totalValue != null ? Number(totalValue) : null;
    return {
      items: data.list.map(normalize).filter(Boolean), page,
      cursor: data.cursor ? { max: Number(data.cursor.max) || 0, view_at: Number(data.cursor.view_at) || 0, business: String(data.cursor.business || '') } : null,
      more: typeof data.has_more === 'boolean' ? data.has_more : total !== null && keyword ? page * 30 < total : data.list.length >= 30,
    };
  }
  async function historyHeartbeat(arg = {}) {
    const video = getSelected();
    const uid = account.snapshot().profile?.uid;
    if (!uid || String(arg.uid) !== String(uid) || !video || video.bvid !== arg.bvid || video.cid !== arg.cid) throw new BiliError('播放记录已失效', 'CANCELLED');
    const time = Number(arg.time);
    if (!Number.isFinite(time) || time < 0) throw new BiliError('播放进度不可用', 'INPUT');
    const payload = {
      bvid: video.bvid, cid: video.cid, played_time: arg.ended ? -1 : Math.floor(Math.min(time, video.duration || time)),
      type: 3, dt: 2, play_type: arg.ended ? 4 : 0,
    };
    // Validate the selected video on receipt, then retain ordering across video changes.
    const pending = heartbeatQueue.catch(() => {}).then(async () => {
      if (String(account.snapshot().profile?.uid) !== String(uid)) throw new BiliError('账号已切换', 'CANCELLED');
      await client.post('/x/click-interface/web/heartbeat', payload);
    });
    heartbeatQueue = pending;
    await pending;
    return { recorded: true };
  }
  return { historyPage, historyHeartbeat };
}
module.exports = { createHistory };
