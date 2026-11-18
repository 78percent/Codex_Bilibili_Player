const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { Module, createRequire } = require('node:module');
const { createMedia } = require('../electron/bilibili/media.cjs');
const { mediaURL, selectMediaURL } = require('../electron/bilibili/media-url.cjs');
const { createClient } = require('../electron/bilibili/client.cjs');

function fixture(label = 'one') {
  const segment = { indexRange: '10-19', Initialization: '0-9' };
  return { dash: { duration: 30,
    video: [{ id: 80, codecid: 7, codecs: 'avc1.640028', width: 1920, height: 1080, bandwidth: 1000, SegmentBase: segment, baseUrl: `https://cdn.bilivideo.com/${label}.m4s` }],
    audio: [{ codecs: 'mp4a.40.2', bandwidth: 128, SegmentBase: segment, baseUrl: `https://cdn.bilivideo.com/${label}.m4a` }],
  } };
}
async function loadWithStubs(relative, stubs) {
  const filename = path.resolve(__dirname, relative);
  const mod = new Module(filename);
  const localRequire = createRequire(filename);
  mod.require = name => Object.hasOwn(stubs, name) ? stubs[name] : localRequire(name);
  mod._compile(await fs.readFile(filename, 'utf8'), filename);
  return mod.exports;
}

test('CDN policy rejects non-HTTPS, credentials, non-CDN hosts and unexpected ports', () => {
  for (const url of ['http://cdn.bilivideo.com/x', 'https://127.0.0.1/x', 'https://bilivideo.com.evil.invalid/x', 'https://u:p@cdn.bilivideo.com/x', 'https://cdn.bilivideo.com:9000/x']) {
    assert.throws(() => mediaURL(url));
  }
  assert.equal(mediaURL('https://a.mcdn.bilivideo.cn:4483/x'), 'https://a.mcdn.bilivideo.cn:4483/x');
  assert.equal(selectMediaURL({ baseUrl: 'https://a.mcdn.bilivideo.cn:4483/x', backupUrl: ['https://cdn.bilivideo.com/x'] }), 'https://cdn.bilivideo.com/x');
});

test('media proxy isolates sources, forwards Range without cookies and rejects invalid requests', async t => {
  const calls = [];
  const media = createMedia({ fetch: async (url, options) => {
    calls.push({ url, options });
    return new Response('0123456789', { status: 206, headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 0-9/30' } });
  } });
  t.after(() => media.close());
  await media.start();
  const first = media.prepare(fixture());
  const manifest = await (await fetch(first.manifest)).text();
  assert.match(manifest, /avc1.640028/);
  const resource = new URL('v-0', first.manifest).href;
  const segment = await fetch(resource, { headers: { Range: 'bytes=0-9' } });
  assert.equal(segment.status, 206);
  assert.equal(await segment.text(), '0123456789');
  assert.equal(calls[0].options.credentials, 'omit');
  assert.equal(calls[0].options.headers.Range, 'bytes=0-9');
  assert.equal(calls[0].options.headers.Cookie, undefined);
  assert.equal((await fetch(resource, { headers: { Range: 'bytes=0-9,20-29' } })).status, 416);
  const second = media.prepare(fixture('two'));
  assert.notEqual(first.manifest, second.manifest);
  assert.equal((await fetch(first.manifest)).status, 403);
  assert.equal((await fetch(resource)).status, 403);
  assert.equal((await fetch(second.manifest)).status, 200);
  const port = new URL(second.manifest).port;
  const malformed = await new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: 'http://[' }, res => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject);
  });
  assert.equal(malformed, 400);
  media.reset();
  assert.equal((await fetch(second.manifest)).status, 403);
});

test('media proxy refuses a CDN redirect to a local/private destination', async t => {
  let calls = 0;
  const media = createMedia({ fetch: async () => { calls++; return new Response(null, { status: 302, headers: { location: 'https://127.0.0.1/private' } }); } });
  t.after(() => media.close());
  await media.start();
  const source = media.prepare(fixture());
  assert.equal((await fetch(new URL('v-0', source.manifest))).status, 502);
  assert.equal(calls, 1);
});

test('a pending CSRF lookup cannot resume a POST after logout reset', async () => {
  let resolveCookies, calls = 0;
  const client = createClient({ cookies: { get: () => new Promise(resolve => { resolveCookies = resolve; }) }, fetch: async () => { calls++; } });
  const post = client.post('/x/click-interface/web/heartbeat', { played_time: 12 });
  const rejected = assert.rejects(post, { code: 'CANCELLED' });
  await client.reset();
  resolveCookies([{ value: 'synthetic-csrf' }]);
  await rejected;
  assert.equal(calls, 0);
});

test('reset aborts in-flight API requests and accepts later requests', async () => {
  let first = true;
  const client = createClient({ fetch: async (_url, options) => {
    if (!first) return new Response(JSON.stringify({ code: 0, data: { ready: true } }));
    first = false;
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
  } });
  const pending = client.request('api.bilibili.com', '/test');
  const rejected = assert.rejects(pending, { code: 'CANCELLED' });
  await client.reset();
  await rejected;
  assert.deepEqual(await client.request('api.bilibili.com', '/test'), { ready: true });
});

test('logout broadcasts invalidation and attempts both file removals even when one fails', async t => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'bili-account-test-'));
  t.after(() => fs.rm(folder, { recursive: true, force: true }));
  const events = [], removed = [];
  let failRemoval = true;
  const { createAccount } = await loadWithStubs('../electron/bilibili/account.cjs', {
    electron: { safeStorage: { isEncryptionAvailable: () => true, encryptString: text => Buffer.from(text) }, BrowserWindow: class {}, shell: {} },
    'node:fs/promises': { ...fs, rm: async (file, options) => {
      removed.push(path.basename(file));
      if (failRemoval && file.endsWith('.bin')) throw new Error('simulated disk denial');
      return fs.rm(file, options);
    } },
  });
  const account = createAccount({
    session: { cookies: { get: async () => [{ name: 'SESSDATA', value: 'synthetic-only' }] }, closeAllConnections: async () => events.push('close'), clearStorageData: async () => events.push('clear') },
    client: { reset: async () => events.push('reset'), nav: async () => ({ mid: 1, uname: 'fixture', mobile_verified: 1, vip: { status: 0 } }) },
    userData: folder, parent: () => null, onChange: snapshot => events.push(snapshot.profile ? 'signed-in' : 'signed-out'),
  });
  await account.check();
  events.length = 0;
  await assert.rejects(account.clear(), { code: 'STORAGE' });
  assert.equal(events[0], 'signed-out');
  assert.equal(account.snapshot().profile, null);
  assert.ok(removed.includes('bilibili-session.bin'));
  assert.ok(removed.includes('bilibili-session.bin.tmp'));
  assert.ok(events.includes('clear'));
  failRemoval = false;
  await account.clear();
  assert.equal(account.snapshot().persistenceError, '');
  await assert.rejects(fs.access(path.join(folder, 'bilibili-session.bin')));
});

test('encryption failure preserves the authenticated profile and reports persistence failure', async () => {
  const { createAccount } = await loadWithStubs('../electron/bilibili/account.cjs', {
    electron: { safeStorage: { isEncryptionAvailable: () => true, encryptString: () => { throw new Error('unavailable'); } } },
  });
  const account = createAccount({ session: { cookies: { get: async () => [{ name: 'SESSDATA', value: 'synthetic-session' }] } },
    client: { nav: async () => ({ mid: 2, uname: 'fixture', mobile_verified: 1 }) }, userData: 'unused', parent: () => null, onChange: () => {} });
  const snapshot = await account.check();
  assert.equal(snapshot.profile.uid, '2');
  assert.match(snapshot.persistenceError, /未保存/);
});
