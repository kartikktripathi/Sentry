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

  // Notify renderer when user exits full screen
  win.on("leave-full-screen", () => {
    win.webContents.send("exit-fullscreen");
  });
}

// Handler to provide screen sources for desktop capture
ipcMain.handle("get-screen-sources", async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 1, height: 1 },
    });

    const screenSources = sources.filter((s) => s.id.startsWith("screen"));
    return (screenSources.length > 0 ? screenSources : sources).map((s) => ({
      id: s.id,
      name: s.name,
    }));
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

  // Handle media/camera permission checks and requests
  if (session && session.defaultSession) {
    session.defaultSession.setPermissionCheckHandler(() => true);
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(true);
    });

    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
      desktopCapturer
        .getSources({
          types: ["screen", "window"],
          thumbnailSize: { width: 1, height: 1 },
        })
        .then((sources) => {
          const screenSources = sources.filter((s) => s.id.startsWith("screen"));
          const selected = screenSources.length > 0 ? screenSources[0] : sources[0];
          if (selected) {
            callback({ video: selected });
          } else {
            callback(null);
          }
        })
        .catch((err) => {
          console.error("Error in setDisplayMediaRequestHandler:", err);
          callback(null);
        });
    });
  }

  createWindow();
});
