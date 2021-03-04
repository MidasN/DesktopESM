const { app, BrowserWindow, screen, Tray, Menu, ipcMain } = require('electron')
const fs = require('fs')
const glob = require('glob')
const path = require('path');

const fileName = glob.sync(path.join(__dirname, './data/*-setup.json'))
const setupFile =  fs.existsSync(fileName[0])

// auto start app when computer boots
// let AutoLaunch = require('auto-launch');
// let autoLauncher = new AutoLaunch({
//     name: "DesktopESM"
// });
// // Checking if autoLaunch is enabled, if not then enabling it.
// autoLauncher.isEnabled().then(function(isEnabled) {
//   if (isEnabled) return;
//    autoLauncher.enable();
// }).catch(function (err) {
//   throw err;
// });

app.setLoginItemSettings({openAtLogin: true})

// App starts
let win;
let tray;

app.on('ready', function (event) {
  createWindow();
  createAboutPage();
  createTray();
  //check if user has already set up
  if (setupFile) {
    win.hide() 
    startCountdown()
  } else {
    win.loadFile('index.html')
  }

  if (app.dock) { //MacOS only
    app.dock.hide()
  } else { 
    win.setSkipTaskbar(true) //Should work for Windows and Linux?
  }

  // app.setActivationPolicy('accessory')
})

// Initialising the window
function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  
  win = new BrowserWindow({
    width: width,
    height: height,
    frame: false, 
    webPreferences: {
      enableRemoteModule: true,
      contextIsolation: false,
      nodeIntegration: true
    }
    // skipTaskbar: true
  })

  // win.webContents.openDevTools()
  
  // win.setAlwaysOnTop(true, "floating", 1);
  win.setVisibleOnAllWorkspaces(true);
  win.setResizable(false)
}

function createAboutPage() {
  app.setAboutPanelOptions({ 
    applicationName: 'DesktopESM for Prolific Study', 
    // applicationVersion: '1.0.0', 
    credits: 'Jonas Frich, PhD & Midas Nouwens, PhD', 
    authors: ['Jonas Frich, PhD', 'Midas Nouwens, PhD'], 
    website: 'https://pure.au.dk/portal/en/persons/jonas-frich-pedersen(1f394a37-c0c2-40b9-b2b5-45e5021746c1).html'
  //,iconPath: path.join(__dirname, '../assets/image.png') 
  })
}

function createTray() {
  if (tray) {
    return
  }

  const contextMenu = Menu.buildFromTemplate([
      {
          label: 'About', role: 'about'
      },
      {
        label: 'Show', click: function() {
          if (win.isVisible()) {
            app.show()
          }
        }
      },
      {
          label: 'Exit', click: function () {
              app.isQuiting = true;
              app.quit();
          }
      }
  ]);

  tray = new Tray(path.join(__dirname, './icons/icon.png'));
  tray.setToolTip('DesktopESM');
  tray.setContextMenu(contextMenu);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Start the countdown to sample when receiving message from the renderer
ipcMain.on('sendMainMessage', (event, props) => {
  if (props.message === 'start countdown from index') {
    startSampling(true)
    // startCountdown()
  } else if(props.message === 'start countdown' ){
       startCountdown()
  }
  // win.webContents.send('sendRendererMessage', { result: true });
});


function startCountdown() {
// const samplingMin = 1800000 //30 minutes in ms 5000 //5s
// const samplingMax = 7200000 // 2hours in ms 10000 //10m
// const samplingMin = 5000 //30 minutes
// const samplingMax = 10000 // 1hour
  const samplingMin = 1800000 //30 minutes
  const samplingMax = 5400000 // 1hour


  const currentTime = Date.now()
  const interval = Math.floor(Math.random() * (samplingMax - samplingMin + 1) + samplingMin);
  
  console.log('start countdown:' + interval +'ms')
  setTimeout(startSampling, interval)
}

function startSampling(setup) {
  const minTime = 8;
  const maxTime = 18;

  const date = new Date()
  const hour = date.getHours()
  const day = date.getDay()
  
  const minDay = 1 //Monday
  const maxDay = 5 //Friday

  if (setup === true) {
    console.log('start setup sampling')
    win.loadFile(path.join(__dirname, './sample.html'))
  } else if (hour >= minTime && hour <= maxTime && day >= minDay && day <= maxDay) {
    console.log('start sampling')
    console.log()
   
    win.loadFile(path.join(__dirname, './sample.html'))
  } else {
    console.log('outside hours: restart countdown')
    startCountdown()
  }
}