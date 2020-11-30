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

    fs.writeFile('./data/participantSetup.json', JSON.stringify(data), 'utf8', (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
  
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
 

// ipcRenderer.on('sendRendererMessage', (event, props) => {
//     console.log({event, props});
// });
  