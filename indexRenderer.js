const { ipcRenderer, remote } = require('electron')
const fs = require('fs')

let finishBtn = document.querySelector('#finishBtn')
finishBtn.addEventListener('click', finishSetup)


// defining new fetch function that retries on failure
const fetchPlus = (url, options = {}, retries) =>
  fetch(url, options)
    .then(res => {
      if (res.ok) {
        myConsole.log('data sucessfully POSTed to database')
        return
      }
      if (retries > 0) {
        myConsole.log('ERROR: retrying POSTing data to database')
        return setTimeout(fetchPlus(url, options, retries - 1), 10000)
      }
      throw new Error(res.status)
    })
    .catch(error => myConsole.error(error.message))

// TODO: add check that they have actually filled in all the stuff for the setup
function finishSetup() {
    let participantId = document.querySelector('#fid').value
    console.log(participantId)
        
    let time = Date.now()

    let data = {
        participantId: participantId,
        setupTime: time
    }

    fs.writeFile('./data/'+ participantId + '-setup.json', JSON.stringify(data), 'utf8', (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });

    fetchPlus('https://desktopesm.herokuapp.com/submit-data', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { "Content-type": "application/json; charset=UTF-8" }
      }, 4)
  
    hide()
    sendMessageToMain()
}
function hide() {
    const currentWindow = remote.getCurrentWindow()
    currentWindow.hide()
}

function sendMessageToMain() {
    ipcRenderer.send('sendMainMessage', {
        message: 'start countdown'
      });
}
