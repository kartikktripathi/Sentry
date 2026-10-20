const { BrowserWindow, app } = require("electron");
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700
  });

  win.loadURL("http://localhost:5173/");

}

app.whenReady().then(() => {
  createWindow();
});