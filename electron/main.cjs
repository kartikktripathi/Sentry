const { BrowserWindow, app, ipcMain, desktopCapturer, session } = require("electron");
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

  ipcMain.on("set-fullscreen", () => {
    win.setFullScreen(true);
  });
}

// Handler to provide screen sources for screen capture
ipcMain.handle("get-screen-sources", async () => {
  try {
    const sources = await desktopCapturer.getSources({ types: ["screen"] });
    return sources.map((s) => ({ id: s.id, name: s.name }));
  } catch (err) {
    console.error("Error retrieving screen sources:", err);
    return [];
  }
});

app.whenReady().then(() => {
  const dockIcon = path.join(__dirname, "icon.png");
  if (process.platform === "darwin" && app.dock) {
    app.dock.setIcon(dockIcon);
  }

  // Handle standard getDisplayMedia requests
  if (session && session.defaultSession) {
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
      desktopCapturer
        .getSources({ types: ["screen"] })
        .then((sources) => {
          if (sources.length > 0) {
            callback({ video: sources[0] });
          } else {
            callback({});
          }
        })
        .catch((err) => {
          console.error("Error in setDisplayMediaRequestHandler:", err);
          callback({});
        });
    });
  }

  createWindow();
});
