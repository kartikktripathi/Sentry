const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  setFullscreen: () => ipcRenderer.send("set-fullscreen"),
  getScreenSources: () => ipcRenderer.invoke("get-screen-sources"),
});