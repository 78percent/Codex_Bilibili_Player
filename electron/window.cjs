const { BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { windowSize } = require('./window-size.cjs');

function createWindow() {
  const window = new BrowserWindow({
    ...windowSize({ width: 1600, height: 1000, minWidth: 1100, minHeight: 640 }),
    title: 'Codex Bilibili Player', frame: false, backgroundColor: '#f9f9f9',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  const contents = window.webContents;
  // Existing message-copy controls need write access; never grant clipboard read.
  const canWriteClipboard = (wc, permission) => wc === contents && permission === 'clipboard-sanitized-write';
  contents.session.setPermissionRequestHandler((wc, permission, callback) => callback(canWriteClipboard(wc, permission)));
  contents.session.setPermissionCheckHandler(canWriteClipboard);
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-navigate', event => event.preventDefault());
  contents.on('will-redirect', event => event.preventDefault());
  contents.on('will-attach-webview', event => event.preventDefault());
  const action = (event, value) => {
    if (window.isDestroyed() || event.sender !== contents || event.senderFrame !== contents.mainFrame) return;
    if (value === 'minimize') window.minimize();
    if (value === 'maximize') window.isMaximized() ? window.unmaximize() : window.maximize();
    if (value === 'close') window.close();
  };
  ipcMain.on('window:action', action);
  window.on('closed', () => ipcMain.removeListener('window:action', action));
  window.maximize();
  return window;
}

module.exports = { createWindow };
