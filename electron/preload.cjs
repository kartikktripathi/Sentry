const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electronAPI", {
  setFullscreen: () => ipcRenderer.send("set-fullscreen"),
  getScreenSources: () => ipcRenderer.invoke("get-screen-sources"),
  onExitFullscreen: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("exit-fullscreen", handler);
    return () => ipcRenderer.removeListener("exit-fullscreen", handler);
  },
});