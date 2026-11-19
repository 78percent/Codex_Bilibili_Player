const { BiliError } = require('./client.cjs');
const { id, count, imageUrl, summary, assertAccount } = require('./uploader-data.cjs');
const { createUploaderContent } = require('./uploader-content.cjs');
const { createUploaderRelations } = require('./uploader-relations.cjs');
const { createUploaderWindow } = require('./uploader-window.cjs');

function createUploader(client, account, options) {
  const official = createUploaderWindow({ ...options, onAccountRefresh: () => account.check(false) });
  return { close: official.close, operations: {
    ...createUploaderContent(client),
    ...createUploaderRelations(client, account),
    uploaderOpen: official.open,
    uploaderProfile: async (arg = {}) => {
      const uid = account.snapshot().profile?.uid || '';
      let mid;
      if (arg.mid) mid = id(arg.mid);
      else {
        if (typeof arg.bvid !== 'string' || !/^BV[0-9A-Za-z]{10}$/.test(arg.bvid)) throw new BiliError('视频编号不可用', 'INPUT');
        // Resolve missing search author IDs without changing the playback session.
        const detail = await client.request('api.bilibili.com', '/x/web-interface/view', { bvid: arg.bvid });
        mid = id(detail?.owner?.mid);
      }
      const data = await client.request('api.bilibili.com', '/x/web-interface/card', { mid, photo: true });
      assertAccount(account, uid);
      if (!data?.card || String(data.card.mid) !== mid || typeof data.card.name !== 'string') throw new BiliError('B站未返回有效的UP主资料');
      const card = data.card;
      return {
        ...summary(card), banner: imageUrl(card.space?.l_img ?? card.space?.s_img),
        followers: count(data.follower ?? card.fans), following: count(card.attention ?? card.friend), videoCount: count(data.archive_count),
        followed: uid ? typeof data.following === 'boolean' ? data.following : null : false,
        isSelf: mid === uid, official: String(card.Official?.title || card.official_verify?.desc || ''),
      };
    },
  } };
}

module.exports = { createUploader };
