const test = require('node:test');
const assert = require('node:assert/strict');
const { constrainWindowSize } = require('../electron/window-size.cjs');

test('main and official window sizes fit a high-DPI laptop work area', () => {
  const area = { width: 910, height: 468 };
  const main = constrainWindowSize({ width: 1600, height: 1000, minWidth: 1100, minHeight: 640 }, area);
  const login = constrainWindowSize({ width: 1080, height: 760 }, area);
  for (const size of [main, login]) {
    assert.ok(size.width <= area.width && size.height <= area.height);
    assert.ok(!size.minWidth || size.minWidth <= size.width);
    assert.ok(!size.minHeight || size.minHeight <= size.height);
  }
});

test('normal desktop dimensions remain unchanged', () => {
  const size = { width: 1600, height: 1000, minWidth: 1100, minHeight: 640 };
  assert.deepEqual(constrainWindowSize(size, { width: 2560, height: 1400 }), size);
});
