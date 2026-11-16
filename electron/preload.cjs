const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("desktop", {
  windowAction: (action) => {
    if (["minimize", "maximize", "close"].includes(action))
      ipcRenderer.send("window:action", action);
  },
});
contextBridge.exposeInMainWorld('bilibili', {
  request: (operation, arg) => ipcRenderer.invoke('bilibili:request', operation, arg),
  onAccount: callback => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('bilibili:account', listener);
    return () => ipcRenderer.removeListener('bilibili:account', listener);
  },
});
