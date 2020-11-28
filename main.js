const { app, BrowserWindow, Menu, Tray, Dock } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('index.html')
  win.webContents.openDevTools()

  win.loadFile('index.html')
  win.webContents.openDevTools()
 
  function createTray() {
    let appIcon = new Tray('./icons/icon.png');
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show', click: function () {
                mainWindow.show();
            }
        },
        {
            label: 'Exit', click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);
  
    appIcon.on('double-click', function (event) {
        mainWindow.show();
    });
    appIcon.setToolTip('Tray Tutorial');
    appIcon.setContextMenu(contextMenu);
    return appIcon;
  }

  let tray = null;
    win.on('minimize', function (event) {
        event.preventDefault();
        win.hide();
        app.dock.hide();
        tray = createTray();
    });

    win.on('restore', function (event) {
        win.show();
        tray.destroy();
    });
   
    return win;
  }

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})