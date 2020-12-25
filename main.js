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
      nodeIntegration: true
    }
    // skipTaskbar: true
  })
  
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

  tray = new Tray('./icons/icon.png');
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
  if (props.message === 'start countdown') {
    startCountdown()
  }
  // win.webContents.send('sendRendererMessage', { result: true });
});


function startCountdown() {
// const samplingMin = 1800000 //30 minutes in ms
// const samplingMax = 7200000 // 2hours in ms
  const samplingMin = 5000 //5s
  const samplingMax = 10000 //10m

  const currentTime = Date.now()
  const interval = Math.floor(Math.random() * (samplingMax - samplingMin + 1) + samplingMin);
  
  console.log('start countdown:' + interval +'ms')
  setTimeout(startSampling, interval)
}

function startSampling() {
  const minTime = 8;
  const maxTime = 20;

  const date = new Date()
  const hour = date.getHours()
  const day = date.getDay()
  
  const minDay = 1 //Monday
  const maxDay = 5 //Friday

  if (hour >= minTime && hour <= maxTime && day >= minDay && day <= maxDay) {
    console.log('start sampling')
    win.loadFile('sample.html')
  } else {
    console.log('outside hours: restart countdown')
    startCountdown()
  }
}