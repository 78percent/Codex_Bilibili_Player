const { app, session, ipcMain } = require('electron');
const { createClient, BiliError } = require('./client.cjs');
const { createAccount } = require('./account.cjs');
const { createMedia } = require('./media.cjs');
const { createSearch } = require('./search.cjs');
const { createCaptions } = require('./captions.cjs');
const { createHistory } = require('./history.cjs');
async function setupBilibili(parent) {
  const accountSession = session.fromPartition('bilibili-account');
  const mediaSession = session.fromPartition('bilibili-media');
  accountSession.setPermissionRequestHandler((_wc,_permission,callback) => callback(false));
  accountSession.setPermissionCheckHandler(() => false);
  const client = createClient(accountSession), media = createMedia(mediaSession);
  const captions = createCaptions(client, mediaSession);
  let selected = null, revision = 0, queue = [], cursor = -1, feedIndex = 0;
  function clearSelection() { revision++; selected = null; media.reset(); captions.reset(); return revision; }
  function clearQueue() { queue = []; cursor = -1; feedIndex = 0; }
  const account = createAccount({ session: accountSession, client, userData: app.getPath('userData'), parent,
    onChange: data => {
      if (!data.profile || data.profile.mobileVerified !== true) { clearSelection(); clearQueue(); }
      const win = parent(); if (win && !win.isDestroyed()) win.webContents.send('bilibili:account',data);
    } });
  app.on('before-quit', () => { captions.reset(); media.close(); });
  // Register IPC immediately; requests wait for services while the window loads.
  const ready = Promise.all([account.restore(), media.start()]);
  async function selectVideo(bvid, current, requestedCid) {
    const detail = await client.request('api.bilibili.com','/x/web-interface/view',{ bvid });
    if (current !== revision) throw new BiliError('选片已取消','CANCELLED');
    if (detail.state < 0) throw new BiliError('此视频目前无法播放');
    if (detail.rights?.pay || detail.rights?.ugc_pay || detail.rights?.ugc_pay_preview) throw new BiliError('此视频是付费内容，当前版本不播放');
    const part = requestedCid ? detail.pages?.find(page => Number(page.cid) === requestedCid) : detail.pages?.[0];
    if (requestedCid && !part) throw new BiliError('这条历史记录的分 P 已不可用');
    const cid = part?.cid || detail.cid;
    if (!cid) throw new BiliError('此视频缺少分 P 信息');
    selected = { bvid: detail.bvid, cid, title: detail.title, cover: String(detail.pic || '').replace(/^http:/,'https:'), author: detail.owner?.name || '', duration: part?.duration || detail.duration };
    return { ...selected, canPrevious: cursor > 0, canNext: true };
  }
  async function recommendations(current) {
    const feed = await client.signed('/x/web-interface/wbi/index/top/feed/rcmd', { fresh_type: 4, ps: 12, fresh_idx: ++feedIndex, fresh_idx_1h: feedIndex, feed_version: 'V8', web_location: 1430650 });
    if (current !== revision) throw new BiliError('选片已取消','CANCELLED');
    return [...new Set((feed.item || []).filter(v => v.goto === 'av' && /^BV[0-9A-Za-z]{10}$/.test(v.bvid) && !v.business_info && !v.is_ad && !v.ad_info).map(v => v.bvid))];
  }
  async function navigate(direction) {
    const target = cursor + direction;
    if (target < 0) throw new BiliError('已经是第一条视频');
    const previous = selected;
    const current = clearSelection();
    try {
      await account.requireBound();
      if (current !== revision) throw new BiliError('选片已取消','CANCELLED');
      if (target >= queue.length) {
        const fresh = await recommendations(current);
        queue.push(...fresh.filter(bvid => !queue.includes(bvid)));
      }
      if (!queue[target]) throw new BiliError('本次推荐没有新视频，请稍后再试');
      const info = await selectVideo(queue[target], current);
      cursor = target;
      return { ...info, canPrevious: cursor > 0, canNext: true };
    } catch (error) {
      if (current === revision) selected = previous;
      throw error;
    }
  }
  async function extra(operation, arg) {
    const current = revision, video = selected;
    if (!video || arg?.bvid !== video.bvid || arg?.cid !== video.cid) throw new BiliError('选片已取消','CANCELLED');
    await account.requireBound();
    if (current !== revision) throw new BiliError('选片已取消','CANCELLED');
    const data = await captions[operation](operation === 'subtitle' ? arg.id : video);
    if (current !== revision) throw new BiliError('选片已取消','CANCELLED');
    return data;
  }
  const operations = {
    ...createSearch(client),
    ...createHistory(client, account, () => selected),
    account: () => account.check(),
    qr: () => account.createQR(),
    pollQR: () => account.pollQR(),
    cancelQR: () => account.cancelQR(),
    officialLogin: method => account.openOfficial(method),
    security: () => account.openSecurity(),
    logout: async () => { clearSelection(); clearQueue(); await account.clear(); return account.snapshot(); },
    selectVideo: async arg => {
      const bvid = typeof arg === 'string' ? arg : arg?.bvid;
      const cid = typeof arg === 'object' && arg?.cid ? Number(arg.cid) : undefined;
      if (cid !== undefined && (!Number.isSafeInteger(cid) || cid <= 0)) throw new BiliError('分 P 编号不可用', 'INPUT');
      if (typeof bvid !== 'string' || !/^BV[0-9A-Za-z]{10}$/.test(bvid)) throw new BiliError('视频编号不可用', 'INPUT');
      const current = clearSelection();
      await account.requireBound();
      if (current !== revision) throw new BiliError('选片已取消','CANCELLED');
      const info = await selectVideo(bvid, current, cid);
      queue = [bvid]; cursor = 0;
      return { ...info, canPrevious: false, canNext: true };
    },
    firstVideo: async () => {
      const current = clearSelection();
      await account.requireBound();
      if (current !== revision) throw new BiliError('选片已取消','CANCELLED');
      const candidates = await recommendations(current);
      if (!candidates.length) throw new BiliError('本次首页推荐没有普通视频，请刷新');
      const info = await selectVideo(candidates[0], current);
      queue = candidates; cursor = 0;
      return { ...info, canPrevious: false, canNext: true };
    },
    previousVideo: () => navigate(-1),
    nextVideo: () => navigate(1),
    subtitles: arg => extra('subtitles', arg),
    subtitle: arg => extra('subtitle', arg),
    danmaku: arg => extra('danmaku', arg),
    playback: async () => {
      const current = revision, video = selected;
      if (!video) throw new BiliError('请先选择视频');
      await account.requireBound();
      const data = await client.signed('/x/player/wbi/playurl',{ bvid: video.bvid, cid: video.cid, fnval: 16, fnver: 0, fourk: 1, qn: 80 });
      if (current !== revision || video !== selected) throw new BiliError('播放已取消','CANCELLED');
      if (data.is_preview) throw new BiliError('此视频仅返回试看资源，当前版本不播放');
      return media.prepare(data);
    },
  };
  ipcMain.handle('bilibili:request', async (event, operation, arg) => {
    const win = parent();
    if (!win || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame || !Object.hasOwn(operations,operation)) return { ok: false, error: { message: '请求不可用', code: 'FORBIDDEN' } };
    const accountUid = account.snapshot().profile?.uid;
    try { await ready; return { ok: true, data: await operations[operation](arg) }; }
    catch (error) {
      // An API expiry invalidates the short-lived account cache immediately.
      if (error.code === 'EXPIRED' && accountUid && account.snapshot().profile?.uid === accountUid) {
        try { await account.clear(); } catch (storageError) { error = storageError; }
      }
      return { ok: false, error: { message: error instanceof BiliError ? error.message : '操作未完成，请重试', code: error.code === 'EXPIRED' ? 'EXPIRED' : error instanceof BiliError ? error.code : 'ERROR' } };
    }
  });
  await ready;
}
module.exports = { setupBilibili };
