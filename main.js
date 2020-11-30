const { app, BrowserWindow, Tray, Menu } = require('electron')

// auto start app when computer boots
let AutoLaunch = require('auto-launch');
let autoLauncher = new AutoLaunch({
    name: "DesktopESM"
});
// Checking if autoLaunch is enabled, if not then enabling it.
autoLauncher.isEnabled().then(function(isEnabled) {
  if (isEnabled) return;
   autoLauncher.enable();
}).catch(function (err) {
  throw err;
});


// Instantiating the window
function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    // frame: false, 
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true
    }
  })

  win.loadFile('index.html')
  win.webContents.openDevTools()
  

  function createTray() {
    let appIcon = new Tray('./icons/icon.png');
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show', click: function () {
                win.show();
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
    appIcon.setToolTip('DesktopESM');
    appIcon.setContextMenu(contextMenu);
    return appIcon;
  }

  let tray = null;
    win.on('hide', function (event) {
        event.preventDefault();
        // win.hide();
        app.dock.hide();
        tray = createTray();
        // destroy the renderer process
    });

    win.on('restore', function (event) {
        win.show();
        tray.destroy();
        // create a new renderer process
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


// based on some event (setup being finished) > start the countdown

startCountdown()

// maximise the app on a certain timer
// const samplingMin = 1800000 //30 minutes in ms
// const samplingMax = 7200000 // 2hours in ms

function startCountdown() {
  const samplingMin = 10000 //30 minutes in ms
  const samplingMax = 5000 // 2hours in ms

  const currentTime = Date.now()
  const interval = Math.floor(Math.random() * (samplingMax - samplingMin + 1) + samplingMin);
  const samplingTime = currentTime + interval
  
  console.log('start countdown:' + interval +'ms')
  setTimeout(startSampling, interval)
}

function startSampling() {
  const minTime = 8;
  const maxTime = 18;
  const date = new Date()
  const hour = date.getHours()

  if (hour > minTime && hour < maxTime) {
    console.log('activate sampling')
    //TODO: this hardcoding seems a bit shit.. other way of detecting main window?
    const window = BrowserWindow.getAllWindows()[0]
    
    window.loadFile('sample.html')
    window.webContents.on('dom-ready', () => {
      console.log('ready to show')
      window.show()
    })
  }
}

