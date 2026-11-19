const { BiliError } = require('./client.cjs');
const { PAGE_SIZE, id, pageNumber, pagination, summary, assertAccount } = require('./uploader-data.cjs');

function createUploaderRelations(client, account) {
  async function write(arg, operation) {
    const uid = id(arg.uid, '账号');
    assertAccount(account, uid);
    const bound = await account.requireBound();
    if (String(bound.uid) !== uid) throw new BiliError('账号已切换，请重新打开页面', 'CANCELLED');
    assertAccount(account, uid);
    await operation(uid);
    assertAccount(account, uid);
  }
  return {
    uploaderRelations: async (arg = {}) => {
      const mid = id(arg.mid), page = pageNumber(arg.page), uid = account.snapshot().profile?.uid || '';
      if (!['following', 'followers'].includes(arg.kind)) throw new BiliError('关系列表类型不可用', 'INPUT');
      const data = await client.request('api.bilibili.com', arg.kind === 'following' ? '/x/relation/followings' : '/x/relation/fans', { vmid: mid, pn: page, ps: PAGE_SIZE });
      assertAccount(account, uid);
      if (!Array.isArray(data?.list)) throw new BiliError('B站未返回有效的关系列表');
      const limit = mid === uid ? arg.kind === 'followers' ? 1000 : Infinity : 100;
      // The list's attribute describes a relationship direction, not a reliable
      // current-account follow button state. Fetch that on the person's profile.
      return { ...pagination(data.total, page, PAGE_SIZE, limit), items: data.list.map(summary).filter(row => row.mid) };
    },
    uploaderFollow: async (arg = {}) => {
      const mid = id(arg.mid);
      if (typeof arg.follow !== 'boolean') throw new BiliError('关注操作不可用', 'INPUT');
      if (mid === String(arg.uid)) throw new BiliError('不能关注自己', 'INPUT');
      await write(arg, uid => client.post('/x/relation/modify', { fid: mid, act: arg.follow ? 1 : 2, re_src: 11 }, { expectedUid: uid }));
      return { followed: arg.follow };
    },
    uploaderDynamicLike: async (arg = {}) => {
      const dynamicId = id(arg.id, '动态');
      if (typeof arg.like !== 'boolean') throw new BiliError('点赞操作不可用', 'INPUT');
      await write(arg, uid => client.post('/x/dynamic/feed/dyn/thumb', { dyn_id_str: dynamicId, up: arg.like ? 1 : 2 }, { json: true, expectedUid: uid }));
      return { liked: arg.like };
    },
  };
}

module.exports = { createUploaderRelations };
