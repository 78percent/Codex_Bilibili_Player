const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

test('video startup, navigation, loading and inert application settings', { timeout: 90000 }, async t => {
  const { createServer } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const server = await createServer({ root, server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  t.after(() => server.close());
  await server.listen();
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'bili-player-ui-'));
  const env = { ...process.env, PLAYER_UI_URL: server.resolvedUrls.local[0], PLAYER_UI_PROFILE: profile };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(path.join(root, 'node_modules/electron/dist/electron.exe'), [path.join(__dirname, 'fixtures/player-ui.cjs')], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  assert.equal(code, 0, output);
  assert.match(output, /PLAYER_UI_OK/);
});
