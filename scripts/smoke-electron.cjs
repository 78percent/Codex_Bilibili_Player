const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const net = require('node:net');

const root = path.resolve(__dirname, '..');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function availablePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const pending = new Map(), errors = [];
  socket.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject, timer } = pending.get(data.id);
      clearTimeout(timer); pending.delete(data.id);
      data.error ? reject(new Error(data.error.message)) : resolve(data.result);
    }
    if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text);
    if (data.method === 'Log.entryAdded' && data.params.entry.level === 'error') errors.push(data.params.entry.text);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
  return { errors, send, close: () => socket.close(), evaluate: async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  } };
}
async function run() {
  const packaged = process.argv.slice(2).find(arg => !arg.startsWith('--'));
  const live = process.argv.includes('--live');
  const executable = packaged ? path.resolve(packaged) : path.join(root, 'node_modules/electron/dist/electron.exe');
  const artifactFolder = path.join(root, '.runtime', 'validation');
  await fs.mkdir(artifactFolder, { recursive: true });
  const profile = await fs.mkdtemp(path.join(artifactFolder, 'profile-'));
  const port = await availablePort();
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE; delete env.BILIBILI_DEV_URL;
  const child = spawn(executable, [...(packaged ? [] : [root]), `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`], { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', launchError;
  child.on('error', error => { launchError = error; });
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  let client;
  const label = packaged ? 'packaged' : 'source';
  try {
    let target;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (launchError) throw launchError;
      try {
        const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1000) })).json();
        target = pages.find(page => page.type === 'page' && page.url.startsWith('file:'));
        if (target) break;
      } catch { /* Wait for this owned process to expose its page. */ }
      await delay(500);
    }
    assert.ok(target, 'Electron must load the production file URL');
    client = await connect(target.webSocketDebuggerUrl);
    await client.send('Runtime.enable'); await client.send('Log.enable');
    for (let attempt = 0; attempt < 40; attempt++) {
      if (await client.evaluate("document.querySelector('#root')?.children.length > 0")) break;
      await delay(250);
    }
    const initial = await client.evaluate(`({ title: document.title, textLength: document.body.innerText.length,
      hasBridge: !!window.bilibili?.request, hasNode: typeof require !== 'undefined',
      csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content,
      mediaSupported: MediaSource.isTypeSupported('video/mp4; codecs="avc1.640028"'),
      userAgent: navigator.userAgent })`);
    assert.ok(initial.textLength > 100, 'React workspace rendered');
    assert.equal(initial.hasBridge, true); assert.equal(initial.hasNode, false);
    assert.ok(initial.csp.includes("script-src 'self'"));
    assert.equal(initial.mediaSupported, true);
    const account = await client.evaluate("window.bilibili.request('account')");
    assert.equal(account.ok, true); assert.equal(account.data.profile, null, 'fresh profile must not inherit credentials');
    const forbidden = await client.evaluate("window.bilibili.request('constructor')");
    assert.equal(forbidden.error.code, 'FORBIDDEN');
    const bound = await client.evaluate("window.bilibili.request('firstVideo')");
    assert.equal(bound.error.code, 'EXPIRED', 'guest cannot use authenticated playback');
    const liveResults = [];
    if (live) {
      // Fresh, unauthenticated profile only. Never log QR tokens or API payloads.
      for (const [operation, arg] of [['hotSearch'], ['searchSuggestions', '哔哩哔哩'], ['searchVideos', { keyword: '哔哩哔哩', page: 1 }], ['qr']]) {
        const value = await client.evaluate(`window.bilibili.request(${JSON.stringify(operation)}, ${JSON.stringify(arg) || 'undefined'}).then(result => ({ operation: ${JSON.stringify(operation)}, ok: result.ok, count: result.ok ? (Array.isArray(result.data) ? result.data.length : result.data?.videos?.length) : undefined, error: result.ok ? undefined : result.error, qrHttps: ${JSON.stringify(operation)} === 'qr' && result.ok ? result.data?.url?.startsWith('https://') : undefined }))`);
        liveResults.push(value);
        console.log('Live API:', JSON.stringify(value));
      }
      await client.evaluate("window.bilibili.request('cancelQR')");
      await fs.writeFile(path.join(artifactFolder, `live-${label}.json`), JSON.stringify(liveResults, null, 2));
    }
    await client.evaluate("document.querySelector('[aria-label=\"搜索B站视频\"]')?.click()");
    await delay(500);
    const searchOpened = await client.evaluate("!!document.querySelector('.video-search-dialog')");
    assert.equal(searchOpened, true, 'search dialog opens');
    await client.evaluate("document.querySelector('[aria-label=\"关闭视频搜索\"]')?.click()");
    assert.equal(await client.evaluate("navigator.permissions.query({name:'clipboard-write'}).then(permission => permission.state)"), 'granted');
    await client.send('Page.reload');
    await delay(1500);
    assert.ok(await client.evaluate("document.querySelector('#root')?.children.length > 0"), 'workspace restores after reload');
    await client.send('Page.bringToFront');
    const screenshot = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: false });
    await fs.writeFile(path.join(artifactFolder, `${label}.png`), Buffer.from(screenshot.data, 'base64'));
    assert.deepEqual(client.errors, [], 'no renderer/CSP errors');
    const report = { passed: true, label, version: require('../package.json').version, initial, liveResults, checks: ['production startup', 'React render', 'sandbox bridge', 'CSP present', 'H264 support', 'fresh account isolation', 'IPC allowlist', 'guest playback gate', 'search dialog', 'clipboard write permission', 'reload persistence', 'no renderer errors'] };
    await fs.writeFile(path.join(artifactFolder, `${label}.json`), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (client) { await client.send('Browser.close').catch(() => {}); client.close(); }
    if (child.exitCode === null) {
      await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)]);
      if (child.exitCode === null) child.kill();
    }
    await fs.writeFile(path.join(artifactFolder, `${label}.log`), output);
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
