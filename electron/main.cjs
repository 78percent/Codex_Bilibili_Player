const { app, Menu, dialog } = require("electron");
const path = require("node:path");
const { createWindow } = require('./window.cjs');
app.setAppUserModelId("local.codex.bilibili.player");
const profilePath = app.commandLine.getSwitchValue('user-data-dir');
app.setPath(
  "userData",
  profilePath && path.isAbsolute(profilePath) ? profilePath : path.join(app.getPath("appData"), !app.isPackaged && process.env.BILIBILI_DEV_URL ? "CodexBilibiliPlayer-Dev" : "CodexBilibiliPlayer"),
);
let window;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
    }
  });
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    window = createWindow();
    window.on("closed", () => { window = null; });
    await require('./bilibili/index.cjs').setupBilibili(() => window);
    if (!window || window.isDestroyed()) return;
    const devUrl = process.env.BILIBILI_DEV_URL;
    if (!app.isPackaged && devUrl && /^http:\/\/127\.0\.0\.1:\d+\/?$/.test(devUrl)) await window.loadURL(devUrl);
    else await window.loadFile(path.join(__dirname, "../dist/index.html"));
  }).catch(() => {
    dialog.showErrorBox('Codex Bilibili Player 无法启动', '无法初始化本机播放服务或加载应用文件。请检查安全软件是否拦截本机连接，并重新下载完整程序后再试。');
    app.quit();
  });
  app.on("window-all-closed", () => app.quit());
}
