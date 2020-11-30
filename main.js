const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron')
const fs = require('fs')

const setupFile = fs.existsSync('./data/participantSetup.json')

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

// App starts
let tray;
let win;
app.whenReady().then(createWindow)

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow()
//   }
// })

// Initialising the window
function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false, 
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true
    },
    // skipTaskbar: true
  })

  win.on('hide', function (event) {
      event.preventDefault();
      
      // TODO: needs some kind of OS check, otherwise it'll throw an error
      // app.dock.hide();
      // app.setSkipTaskbar(true);

      tray = createTray();

      // destroy the renderer process
      // win.reload()
  });

  win.on('show', function (event) {
    if (tray){
      tray.destroy();
    }
  
      // create a new renderer process
  });


  //check if user has already set up
  if (setupFile) {
    win.hide()
    startCountdown()
  } else {
    win.loadFile('index.html')
    // win.webContents.openDevTools()
  }
  
  return win;
}

function createTray() {
  if (tray) {
    return
  }

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

  let appIcon = new Tray('./icons/icon.png');
  appIcon.setToolTip('DesktopESM');
  appIcon.setContextMenu(contextMenu);

  return appIcon;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})



ipcMain.on('sendMainMessage', (event, props) => {
  if (props.message === 'start countdown') {
    startCountdown()
  }

  // win.webContents.send('sendRendererMessage', { result: true });
});


function startCountdown() {
// const samplingMin = 1800000 //30 minutes in ms
// const samplingMax = 7200000 // 2hours in ms
  const samplingMin = 10000 //10s
  const samplingMax = 5000 // 5s

  const currentTime = Date.now()
  const interval = Math.floor(Math.random() * (samplingMax - samplingMin + 1) + samplingMin);
  const samplingTime = currentTime + interval
  
  console.log('start countdown:' + interval +'ms')
  setTimeout(startSampling, interval)
}

let minTime = 8;
let maxTime = 24;

function startSampling() {
  const date = new Date()
  const hour = date.getHours()

  if (hour > minTime && hour < maxTime) {
    console.log('start sampling')
    win.loadFile('sample.html')
  }
}

