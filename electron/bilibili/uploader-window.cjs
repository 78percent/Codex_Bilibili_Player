const { BrowserWindow } = require('electron');
const { BiliError } = require('./client.cjs');
const { id } = require('./uploader-data.cjs');
const { windowSize } = require('../window-size.cjs');

function allowed(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && (url.hostname === 'bilibili.com' || url.hostname.endsWith('.bilibili.com'));
  } catch { return false; }
}
function createUploaderWindow({ session, parent, onAccountRefresh }) {
  let officialWindow = null;
  const open = async (arg = {}) => {
    const url = arg.dynamicId !== undefined
      ? `https://t.bilibili.com/${id(arg.dynamicId, '动态')}`
      : `https://space.bilibili.com/${id(arg.mid)}`;
    const owner = parent();
    if (!owner || owner.isDestroyed()) throw new BiliError('主窗口已关闭', 'CANCELLED');
    if (!officialWindow || officialWindow.isDestroyed()) {
      const win = new BrowserWindow({
        ...windowSize({ width: 1120, height: 800 }, owner), title: 'B站', parent: owner, autoHideMenuBar: true,
        webPreferences: { session, sandbox: true, contextIsolation: true, nodeIntegration: false },
      });
      officialWindow = win;
      win.webContents.setWindowOpenHandler(({ url: next }) => {
        if (allowed(next)) win.loadURL(next).catch(() => {});
        return { action: 'deny' };
      });
      win.webContents.on('will-navigate', event => { if (!allowed(event.url)) event.preventDefault(); });
      win.webContents.on('will-redirect', event => { if (!allowed(event.url)) event.preventDefault(); });
      win.webContents.on('will-frame-navigate', event => { if (!allowed(event.url)) event.preventDefault(); });
      const refresh = () => { if (!owner.isDestroyed()) Promise.resolve().then(onAccountRefresh).catch(() => {}); };
      const close = () => { if (!win.isDestroyed()) win.destroy(); };
      owner.once('closed', close);
      owner.on('focus', refresh);
      win.once('closed', () => {
        owner.removeListener('closed', close); owner.removeListener('focus', refresh);
        if (officialWindow === win) officialWindow = null;
        refresh();
      });
    }
    const win = officialWindow;
    if (win.isMinimized()) win.restore();
    win.show(); win.focus();
    try { await win.loadURL(url); }
    catch { throw new BiliError('官方页面未能打开，请重试'); }
    return { opened: true };
  };
  return { open, close: () => { if (officialWindow && !officialWindow.isDestroyed()) officialWindow.destroy(); } };
}

module.exports = { createUploaderWindow };
