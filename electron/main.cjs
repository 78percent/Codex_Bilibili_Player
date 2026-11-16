const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("node:path");
app.setAppUserModelId("local.codex.bilibili.player");
app.setPath(
  "userData",
  path.join(app.getPath("appData"), !app.isPackaged && process.env.BILIBILI_DEV_URL ? "CodexBilibiliPlayer-Dev" : "CodexBilibiliPlayer"),
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
    window = new BrowserWindow({
      width: 1600,
      height: 1000,
      minWidth: 1100,
      minHeight: 640,
      title: "Codex Bilibili Player",
      frame: false,
      backgroundColor: "#f9f9f9",
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    ipcMain.on("window:action", (event, action) => {
      if (event.sender !== window.webContents) return;
      if (action === "minimize") window.minimize();
      if (action === "maximize")
        window.isMaximized() ? window.unmaximize() : window.maximize();
      if (action === "close") window.close();
    });
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event) => event.preventDefault());
    await require('./bilibili/index.cjs').setupBilibili(() => window);
    const devUrl = process.env.BILIBILI_DEV_URL;
    if (!app.isPackaged && devUrl && /^http:\/\/127\.0\.0\.1:\d+\/?$/.test(devUrl)) window.loadURL(devUrl);
    else window.loadFile(path.join(__dirname, "../dist/index.html"));
    window.on("closed", () => {
      window = null;
    });
  });
  app.on("window-all-closed", () => app.quit());
}
