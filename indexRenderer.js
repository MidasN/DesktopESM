const { ipcRenderer, remote } = require('electron')
const fs = require('fs')

let finishBtn = document.querySelector('#finishBtn')
finishBtn.addEventListener('click', finishSetup)

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

    fetch('https://desktopesm.herokuapp.com/submit-data', { 
        method: 'POST',
        body: JSON.stringify(data),
        headers: {"Content-type": "application/json; charset=UTF-8"}
      }).then(function(response) {
        // check for response, otherwise try again?
        
      })  
  
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
