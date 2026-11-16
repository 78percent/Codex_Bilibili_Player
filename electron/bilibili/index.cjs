const { app, session, ipcMain } = require('electron');
const { createClient, BiliError } = require('./client.cjs');
const { createAccount } = require('./account.cjs');
const { createMedia } = require('./media.cjs');
async function setupBilibili(parent) {
  const accountSession = session.fromPartition('bilibili-account');
  const mediaSession = session.fromPartition('bilibili-media');
  accountSession.setPermissionRequestHandler((_wc,_permission,callback) => callback(false));
  accountSession.setPermissionCheckHandler(() => false);
  const client = createClient(accountSession), media = createMedia(mediaSession);
  let selected = null, revision = 0;
  const account = createAccount({ session: accountSession, client, userData: app.getPath('userData'), parent,
    onChange: data => {
      if (!data.profile || data.profile.mobileVerified !== true) { revision++; selected = null; media.reset(); }
      const win = parent(); if (win && !win.isDestroyed()) win.webContents.send('bilibili:account',data);
    } });
  await account.restore(); await media.start();
  const operations = {
    account: () => account.check(),
    qr: () => account.createQR(),
    pollQR: () => account.pollQR(),
    cancelQR: () => account.cancelQR(),
    officialLogin: method => account.openOfficial(method),
    security: () => account.openSecurity(),
    logout: async () => { revision++; selected = null; media.reset(); await account.clear(); return account.snapshot(); },
    firstVideo: async () => {
      const current = ++revision;
      selected = null; media.reset();
      await account.requireBound();
      const feed = await client.signed('/x/web-interface/wbi/index/top/feed/rcmd', { fresh_type: 4, ps: 12, fresh_idx: 1, fresh_idx_1h: 1, feed_version: 'V8', web_location: 1430650 });
      const first = feed.item?.find(v => v.goto === 'av' && v.bvid && !v.business_info && !v.is_ad && !v.ad_info);
      if (!first) throw new BiliError('本次首页推荐没有普通视频，请刷新');
      const detail = await client.request('api.bilibili.com','/x/web-interface/view',{ bvid: first.bvid });
      if (current !== revision) throw new BiliError('选片已取消','CANCELLED');
      if (detail.state < 0) throw new BiliError('首页首个视频目前无法播放');
      if (detail.rights?.pay || detail.rights?.ugc_pay || detail.rights?.ugc_pay_preview) throw new BiliError('首页首个视频是付费内容，当前版本不播放');
      const cid = detail.pages?.[0]?.cid || detail.cid;
      if (!cid) throw new BiliError('首页首个视频缺少分 P 信息');
      selected = { bvid: detail.bvid, cid, title: detail.title, cover: String(detail.pic || '').replace(/^http:/,'https:'), author: detail.owner?.name || '', duration: detail.pages?.[0]?.duration || detail.duration };
      return selected;
    },
    playback: async () => {
      const current = revision, video = selected;
      if (!video) throw new BiliError('请先获取首页视频');
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
    try { return { ok: true, data: await operations[operation](arg) }; }
    catch (error) { return { ok: false, error: { message: error instanceof BiliError ? error.message : '操作未完成，请重试', code: error.code === 'EXPIRED' ? 'EXPIRED' : error instanceof BiliError ? error.code : 'ERROR' } }; }
  });
  app.on('before-quit', () => media.close());
}
module.exports = { setupBilibili };
