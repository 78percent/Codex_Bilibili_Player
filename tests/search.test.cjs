const test = require('node:test');
const assert = require('node:assert/strict');
const { createSearch } = require('../electron/bilibili/search.cjs');

test('video search sends complete server conditions and retains response statistics', async () => {
  let requested;
  const search = createSearch({ signed: async (path, params) => {
    requested = { path, params };
    return { numPages: 3, numResults: 43, result: [
      { bvid: 'BV1234567890', title: '<em>Title</em>', mid: 123, video_review: 31, favorites: 7, typename: '知识' },
      { bvid: 'BV9999999999', is_ad: true },
    ] };
  } });
  const page = await search.searchVideos({ keyword: 'search', page: 2, order: 'stow', duration: 3, tids: 36 });
  assert.equal(requested.path, '/x/web-interface/wbi/search/type');
  assert.deepEqual(requested.params, { search_type: 'video', keyword: 'search', page: 2, page_size: 20, order: 'stow', duration: 3, tids: 36 });
  assert.equal(page.order, 'stow'); assert.equal(page.duration, 3); assert.equal(page.tids, 36);
  assert.equal(page.videos.length, 1); assert.equal(page.videos[0].title, 'Title');
  assert.equal(page.videos[0].danmaku, 31); assert.equal(page.videos[0].favorites, 7);
  assert.equal(page.pages, 3); assert.equal(page.total, 43);
});

test('search rejects unsupported conditions before sending a request', async () => {
  const search = createSearch({ signed: async () => { throw new Error('must not request'); } });
  for (const extra of [{ order: 'followers' }, { duration: 5 }, { tids: -1 }, { page: 0 }]) {
    await assert.rejects(search.searchVideos({ keyword: 'search', ...extra }), error => error.code === 'INPUT');
  }
});

test('related uploaders use only bili_user, preserve order and cap unique valid accounts', async () => {
  const search = createSearch({ signed: async (path, params) => {
    assert.equal(path, '/x/web-interface/wbi/search/all/v2');
    assert.deepEqual(params, { keyword: 'search' });
    return { result: [
      { result_type: 'user', data: [{ mid: 999, uname: 'Do not infer this module' }] },
      { result_type: 'bili_user', data: [{ mid: 30, uname: '<em>First</em>', fans: 0 }, { mid: 30, uname: 'Duplicate' },
        { mid: 10, uname: 'Second' }, { mid: 20, uname: 'Third' }] },
    ] };
  } });
  const items = await search.searchUploaders({ keyword: 'search' });
  assert.deepEqual(items.map(item => item.mid), ['30', '10']);
  assert.equal(items[0].name, 'First'); assert.equal(items[0].followers, 0);
  assert.equal(items[1].followers, null); assert.equal(items[1].videoCount, null);
});

test('missing uploader module is empty but malformed or failed response remains an error', async () => {
  assert.deepEqual(await createSearch({ signed: async () => ({ result: [] }) }).searchUploaders({ keyword: 'search' }), []);
  for (const response of [{}, { result: [{ result_type: 'bili_user', data: {} }] }]) {
    await assert.rejects(createSearch({ signed: async () => response }).searchUploaders({ keyword: 'search' }));
  }
  const failure = new Error('network failure');
  await assert.rejects(createSearch({ signed: async () => { throw failure; } }).searchUploaders({ keyword: 'search' }), error => error === failure);
});
