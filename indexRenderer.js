const { desktopCapturer, ipcRenderer, remote } = require('electron')
const fs = require('fs')

let finishBtn = document.querySelector('#finishBtn')
finishBtn.addEventListener('click', finishSetup)

let nodeConsole = require('console');
let myConsole = new nodeConsole.Console(process.stdout, process.stderr);

// defining new fetch function that retries on failure
const fetchPlus = (url, options = {}, retries) =>
  fetch(url, options)
    .then(res => {
      if (res.ok) {
        myConsole.log('index data sucessfully POSTed to database')
        return
      }
      if (retries > 0) {
        myConsole.log('ERROR: retrying POSTing index data to database')
        return setTimeout(fetchPlus, 10000, url, options, retries - 1)
      }
      throw new Error(res.status)
    })
    .then(res => {
      sendMessageToMain()
      return
    })
    .catch(error => myConsole.error(error.message))


// Trigger screen capture permissions
desktopCapturer.getSources({ types: ['screen'] })
    
// TODO: add check that they have actually filled in all the stuff for the setup
function finishSetup() {
    let participantId = document.querySelector('#fid').value
    console.log(participantId)
        
    let time = Date.now()

    let data = {
        participantId: participantId,
        setupTime: time,
        setupLocation: __dirname
    }

    fs.writeFile(__dirname + '/data/'+ participantId + '-setup.json', JSON.stringify(data), 'utf8', (err) => {
        if (err) throw err;
        myConsole.log('The index file has been saved!');
    });

    fetchPlus('https://desktopesm.herokuapp.com/submit-data', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { "Content-type": "application/json; charset=UTF-8" }
    }, 4)

    hide()
}
function hide() {
    const currentWindow = remote.getCurrentWindow()
    currentWindow.hide()
}

function sendMessageToMain() {
    ipcRenderer.send('sendMainMessage', {
        message: 'start countdown from index'
      });
}
