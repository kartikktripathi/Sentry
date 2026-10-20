const { BrowserWindow, app } = require("electron");
const path = require("path");

function createWindow() {
  const iconPath = path.join(__dirname, "icon.png");

  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: iconPath,
  });

  win.loadURL("http://localhost:5173/");
}

app.whenReady().then(() => {
  const dockIcon = path.join(__dirname, "icon.png");
  app.dock.setIcon(dockIcon);

  createWindow();
});
