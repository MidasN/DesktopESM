const { app, BrowserWindow, screen, Tray, Menu, ipcMain } = require('electron')
const fs = require('fs')
const glob = require('glob')

const fileName = glob.sync('./data/*-setup.json')
const setupFile =  fs.existsSync(fileName[0])

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

  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  
  win = new BrowserWindow({
    width: width,
    height: height,
    frame: false, 
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true
    }
    
    // skipTaskbar: true
  })
  
  // win.setAlwaysOnTop(true, "floating", 1);
  win.setVisibleOnAllWorkspaces(true);
  win.setResizable(false)

  win.on('minimize', function (event) {
      event.preventDefault();
      
      
      // app.setSkipTaskbar(true);
      // app.dock.hide();
      
      // TODO: needs some kind of OS check, otherwise it'll throw an error
      // apparently no errors are thrown when running not platform spec functions??

      //windows specific 
      
     // app.setSkipTaskbar(true);

      app.dock.hide();

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
  // startSampling()
  setTimeout(startSampling, interval)
}

let minTime = 8;
let maxTime = 20;
let minDay = 1 //Monday
let maxDay = 5 //Friday

function startSampling() {
  const date = new Date()
  const hour = date.getHours()
  const day = date.getDay()

  if (hour >= minTime && hour <= maxTime && day >= minDay && day <= maxDay) {
    console.log('start sampling')
    win.loadFile('sample.html')
  } else {
    console.log('outside hours: restart countdown')
    startCountdown()
  }
}

