const { BrowserWindow, app, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const iconPath = path.join(__dirname, "icon.png");

  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  win.loadURL("http://localhost:5173/");

  ipcMain.on('set-fullscreen', () => {
    win.setFullScreen(true)
  })
}

app.whenReady().then(() => {
  const dockIcon = path.join(__dirname, "icon.png");
  app.dock.setIcon(dockIcon);

  createWindow();
});
