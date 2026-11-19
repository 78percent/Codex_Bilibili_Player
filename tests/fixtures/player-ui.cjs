const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
app.setPath('userData', process.env.PLAYER_UI_PROFILE);
const failures = [];
let window, releaseSelection, playbackRequests = 0, selectionRequests = 0;
const searchRequests = [];
const selection = new Promise(resolve => { releaseSelection = resolve; });
const profile = { uid: 'ui-fixture', name: 'Fixture', avatar: '', mobileVerified: true, membership: '普通会员' };
const video = { bvid: 'BV1234567890', cid: 1, title: '恢复的视频', author: 'Fixture', cover: '', duration: 120, canPrevious: false, canNext: true,
  parts: [{ cid: 1, page: 1, title: '正片', duration: 120 }], part: 1, partTitle: '正片' };
const thread = (id, title) => ({ id, title, projectId: 'orbit', messages: [{ id: id + '-message', role: 'user', text: title, createdAt: '12:00' }], files: [], terminal: [], updatedAt: 1, status: 'idle', branch: 'main', pr: 0 });
const workspace = { threads: [thread('video-thread', '视频所属对话'), thread('other-thread', '另一个对话')], page: 'thread', activeThread: 'other-thread', settings: { layoutRevision: 3, videoCardWidth: 520 }, panelOpen: true, panelWidth: 440 };
workspace.threads[0].messages = []; // Search-created video chats have no mock conversation messages.
const read = expression => window.webContents.executeJavaScript(expression);
async function waitFor(expression) {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (await read(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Timed out: ' + expression);
}
async function check(name, run) {
  try { await run(); console.log('PASS ' + name); }
  catch (error) { failures.push(name + ': ' + error.message); }
}
app.whenReady().then(async () => {
  const preload = path.join(process.env.PLAYER_UI_PROFILE, 'fixture-preload.cjs');
  await fs.writeFile(preload, `const { contextBridge, ipcRenderer } = require('electron');
localStorage.setItem('codex-bilibili-player:v1', ${JSON.stringify(JSON.stringify(workspace))});
localStorage.setItem('bilibili-last-playback-v1:ui-fixture', JSON.stringify({ bvid: 'BV1234567890', cid: 1, time: 37, thread: 'video-thread' }));
contextBridge.exposeInMainWorld('bilibili', { request: (operation, arg) => ipcRenderer.invoke('fixture:request', operation, arg), onAccount: () => () => {} });`);
  ipcMain.handle('fixture:request', async (_event, operation, arg) => {
    if (operation === 'account') return { ok: true, data: { profile, persistenceError: '' } };
    if (operation === 'selectVideo') {
      await selection;
      if (++selectionRequests === 1) return { ok: false, error: { code: 'FIXTURE', message: '模拟恢复失败' } };
      return { ok: true, data: video };
    }
    if (operation === 'subtitles') return { ok: true, data: [] };
    if (operation === 'danmaku') return { ok: true, data: '<i><state>0</state></i>' };
    if (operation === 'hotSearch' || operation === 'searchSuggestions') return { ok: true, data: [] };
    if (operation === 'searchVideos') {
      searchRequests.push(arg);
      return { ok: true, data: { ...arg, pages: 2, total: 21, videos: [{ bvid: 'BV1234567890', title: arg.keyword,
        author: 'Search author', authorId: '123', cover: '', duration: 120, views: 100, publishedAt: 1 }] } };
    }
    if (operation === 'searchUploaders') return { ok: true, data: arg.keyword === 'First query'
      ? [{ mid: '123', name: 'Search author', avatar: '', sign: 'Profile', followers: 10, videoCount: 2 }] : [] };
    if (operation === 'uploaderProfile') return { ok: true, data: { mid: '123', name: 'Search author', avatar: '', banner: '',
      sign: 'Profile', official: '', followers: 10, following: 0, videoCount: 2, followed: false, isSelf: false } };
    if (operation === 'playback') playbackRequests++;
    return { ok: false, error: { code: 'FIXTURE', message: 'Unexpected fixture operation: ' + operation } };
  });
  window = new BrowserWindow({ show: false, width: 1600, height: 1000, webPreferences: { preload, contextIsolation: true, sandbox: true } });
  const runtimeErrors = [];
  window.webContents.on('console-message', event => { if (event.level === 'error' && /Uncaught|ReferenceError|TypeError/.test(event.message)) runtimeErrors.push(event.message); });
  await window.loadURL(process.env.PLAYER_UI_URL);
  await waitFor("!!document.querySelector('.bili-stage')");
  await check('startup keeps preview collapsed while restoring', async () => assert.equal(await read("!!document.querySelector('.bili-dock-body')"), false));
  await check('loading has a stable noninteractive indicator', async () => {
    await waitFor("!!document.querySelector('.bili-loading-status')");
    assert.equal(await read("!!document.querySelector('.bili-play-button:disabled')"), false);
    assert.equal(await read("document.querySelector('.bili-stage').getAttribute('aria-busy')"), 'true');
  });
  releaseSelection();
  await check('empty video chat exposes restore errors and retry', async () => {
    await waitFor("document.querySelector('.bili-video-error')?.textContent.includes('模拟恢复失败')");
    assert.equal(await read("!!document.querySelector('.bili-chat-card')"), true);
    await read("document.querySelector('.bili-video-error button').click()");
  });
  await waitFor("!!document.querySelector('.bili-chat-card header span[title=\"恢复的视频\"]')");
  await check('restored video is in its chat, paused at saved position', async () => {
    assert.equal(await read("!!document.querySelector('.bili-chat-card .bili-stage.active video')"), true);
    assert.equal(await read("!!document.querySelector('.bili-dock-body')"), false);
    assert.match(await read("document.querySelector('.bili-time').textContent"), /0:37/);
    assert.equal(playbackRequests, 0);
  });
  await check('play rail button returns to video owner from another page', async () => {
    await read("document.querySelector('.activity-rail button[aria-label=\"主页\"]').click()");
    await waitFor("!document.querySelector('.bili-chat-card')");
    await read("document.querySelector('.activity-rail button[aria-label=\"回到视频对话\"]').click()");
    await waitFor("!!document.querySelector('.bili-chat-card .bili-stage.active video')");
    assert.equal(playbackRequests, 0);
  });
  await check('application settings icon and shortcut cannot open a page', async () => {
    assert.equal(await read("document.querySelector('.activity-rail button[aria-label=\"设置\"]').disabled"), true);
    await read("document.querySelector('.activity-rail button[aria-label=\"设置\"]').click(); window.dispatchEvent(new KeyboardEvent('keydown', { key: ',', ctrlKey: true, bubbles: true }))");
    assert.equal(await read("!!document.querySelector('.settings-layout')"), false);
    assert.equal(await read("!!document.querySelector('.bili-chat-card .bili-stage.active video')"), true);
  });
  await check('search filters, UP visibility and keyword history retain complete conditions', async () => {
    await read("document.querySelector('.activity-rail button[aria-label=\"搜索B站视频\"]').click()");
    await waitFor("!!document.querySelector('.video-search-input input')");
    const enterQuery = async query => {
      await read(`(() => { const input = document.querySelector('.video-search-input input');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(query)});
        input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
      await waitFor(`document.querySelector('.video-search-input input')?.value === ${JSON.stringify(query)}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      await read("document.querySelector('.video-search-input').requestSubmit()");
      await waitFor(`document.querySelector('.video-result-title')?.textContent === ${JSON.stringify(query)}`);
    };
    await enterQuery('First query');
    await waitFor("!!document.querySelector('.video-search-uploader')");
    await read("document.querySelector('[data-browser-focus=\"search-order-click\"]').click()");
    await waitFor("document.querySelector('[data-browser-focus=\"search-order-click\"]').getAttribute('aria-pressed') === 'true' && !document.querySelector('.video-search-uploader')");
    await read("document.querySelector('[data-browser-focus=\"search-filter-toggle\"]').click(); document.querySelector('[data-browser-focus=\"search-duration-2\"]').click()");
    await waitFor("document.querySelector('[data-browser-focus=\"search-duration-2\"]').getAttribute('aria-pressed') === 'true'");
    await read("document.querySelector('.video-search-pagination [aria-label=\"下一页\"]').click()");
    await waitFor("document.querySelector('.video-search-pagination span')?.textContent === '2 / 2'");
    await enterQuery('Second query');
    assert.equal(searchRequests.at(-1).order, 'totalrank');
    assert.equal(searchRequests.at(-1).duration, 0); assert.equal(searchRequests.at(-1).page, 1);
    await read("document.querySelector('.uploader-browser-toolbar [aria-label=\"后退\"]').click()");
    await waitFor("document.querySelector('.video-result-title')?.textContent === 'First query' && document.querySelector('.video-search-pagination span')?.textContent === '2 / 2'");
    assert.equal(await read("document.querySelector('[data-browser-focus=\"search-order-click\"]').getAttribute('aria-pressed')"), 'true');
    assert.equal(await read("document.querySelector('[data-browser-focus=\"search-duration-2\"]').getAttribute('aria-pressed')"), 'true');
    assert.equal(await read("!!document.querySelector('.video-search-uploader')"), false);
    await read("document.querySelector('[aria-label=\"关闭视频搜索\"]').click()");
  });
  await check('no renderer exceptions', () => assert.deepEqual(runtimeErrors, []));
  if (failures.length) { console.error(failures.join('\n')); app.exit(1); }
  else { console.log('PLAYER_UI_OK'); app.exit(0); }
}).catch(error => { console.error(error); app.exit(1); });
