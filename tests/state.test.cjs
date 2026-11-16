const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { Module, createRequire } = require('node:module');
const { buildSync } = require('esbuild');
function load(relative) {
  const filename = path.resolve(__dirname, relative);
  const result = buildSync({ entryPoints: [filename], bundle: true, write: false, platform: 'node', format: 'cjs' });
  const mod = new Module(filename);
  mod.require = createRequire(filename);
  mod._compile(result.outputFiles[0].text, filename);
  return mod.exports;
}
const storage = new Map();
global.window = { innerWidth: 1600 };
global.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
const workspace = load('../src/state/persistence.ts');
const history = load('../src/features/history/storage.ts');
const historyTypes = load('../src/features/history/types.ts');
const search = load('../src/features/video-search/storage.ts');

test('workspace persistence retains user messages and applies startup layout', () => {
  storage.clear();
  const state = workspace.restore();
  state.threads[0].messages.push({ id: 'synthetic', role: 'user', text: 'fixture message', createdAt: '12:00' });
  state.panelOpen = true;
  workspace.persist(state);
  const restored = workspace.restore();
  assert.equal(restored.threads[0].messages.at(-1).text, 'fixture message');
  assert.equal(restored.panelOpen, false);
  assert.equal(restored.settings.videoOpen, false);
});

test('damaged core collections recover and interrupted runs become stopped', () => {
  storage.clear();
  const state = workspace.restore();
  state.projects = null;
  state.installed = [null];
  state.runs = [{ threadId: state.threads[0].id, status: 'running', step: 0 }];
  workspace.persist(state);
  const restored = workspace.restore();
  assert.ok(Array.isArray(restored.projects) && restored.projects.length > 0);
  assert.ok(restored.installed.every(value => typeof value === 'string'));
  assert.equal(restored.runs[0].status, 'stopped');
  assert.ok(restored.runs[0].pausedAt > 0);
});

test('history is account scoped and reloads cached pages after restart', () => {
  storage.clear();
  const value = { ...historyTypes.emptyHistory(), loaded: true, page: 4, more: true, cursor: { max: 10, view_at: 20, business: 'archive' },
    items: [{ bvid: 'BV1234567890', cid: 1, title: 'fixture', viewedAt: 10 }], draft: 'retained filter' };
  history.writeHistory('fixture-a', value);
  const restored = history.readHistory('fixture-a');
  assert.equal(restored.items.length, 1);
  assert.equal(restored.draft, value.draft);
  assert.equal(restored.loaded, false);
  assert.equal(restored.page, 1);
  assert.equal(restored.cursor, null);
  assert.equal(restored.more, false);
  assert.equal(history.readHistory('fixture-b').items.length, 0);
});

test('search keeps only bounded recent terms, separated by account', () => {
  storage.clear();
  search.persistRecent('fixture-a', ['one', 'one', 'two', ...Array.from({ length: 20 }, (_, i) => String(i))]);
  const restored = search.restoreSearch('fixture-a');
  assert.equal(restored.recent.length, 10);
  assert.deepEqual(restored.recent.slice(0, 2), ['one', 'two']);
  assert.equal(restored.result, null);
  assert.equal(search.restoreSearch('fixture-b').recent.length, 0);
});
