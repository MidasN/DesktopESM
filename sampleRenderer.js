const fs = require('fs')
const { desktopCapturer, ipcRenderer, remote } = require('electron')
const glob = require('glob')
const fileName = glob.sync('./data/*-setup.json')
const setupData = fs.readFileSync(fileName[0])
const participantId = JSON.parse(setupData).participantId
const currentWindow = remote.getCurrentWindow()
let nodeConsole = require('console');
let myConsole = new nodeConsole.Console(process.stdout, process.stderr);
const currentWidth = currentWindow.getSize()[0];
const currentHeight = currentWindow.getSize()[1];

// TAKING SCREENSHOT
// Video stream
desktopCapturer.getSources({ types: ['screen'] }).then(async sources => {
  myConsole.log("Number of screens detected: " + sources.length);


  for (i=0; i<sources.length;i++) {
    let id = sources[i].id
    myConsole.log('processing screen')
    try {
      var stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: id,
            minWidth: currentWidth,
            // maxWidth: 2560,
            minHeight: currentHeight
            // maxHeight: 1600
          }
        }
      })
      handleStream(stream, id)
    } catch (e) {
      myConsole.log("something went wrong!");
      handleError(e)
    }
  }
  return
})


function handleStream(stream, id) {
  myConsole.log('stream being handled', stream)
  let elementId = id.split(':')[1]
  let video = document.createElement('video')
  video.id = 'video-'+elementId
  video.srcObject = stream
  

  video.addEventListener('loadedmetadata', function (e) {
    video.play();
    createScreenshot(elementId)
    currentWindow.show()
  })
  
  let target = document.querySelector('#videoContainer')
  target.appendChild(video)
}



function createScreenshot(id) {
  myConsole.log('creating screenshot') 

  const video = document.querySelector('#video-'+id)

  const screenshotWrapper = document.createElement('div')
  screenshotWrapper.classList.add('screenshot')
  
  const image = document.createElement('img')
  image.id = 'img-'+id

  canvas = document.createElement('canvas');
  let videoWidth = video.videoWidth;
  let videoHeight = video.videoHeight;
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  canvas.id = 'canvas'+id
  // canvas.getContext("2d").drawImage(video, 0, 0, width * 0.3, height * 0.3);
  canvas.getContext("2d").drawImage(video, 0, 0);

  let canvasOverlay = document.createElement('canvas')
  let resizeRatio = 0.3
  let resizedWidth = videoWidth * resizeRatio
  let resizedHeight = videoHeight * resizeRatio
  canvasOverlay.width = resizedWidth
  canvasOverlay.height = resizedHeight
  
  screenshotWrapper.appendChild(canvasOverlay)

  // Annotate image
  canvasOverlay.addEventListener('click', addCircle)

  function addCircle(e) {
    console.log('canvas clicked')
    document.querySelector('.annotatetext').style.opacity = 0;
    let c = canvasOverlay.getContext('2d');
    let bounds = e.target.getBoundingClientRect();
    let x = e.clientX - bounds.left;
    let y = e.clientY - bounds.top;

    c.beginPath();
    c.arc(x, y, 10, 0, Math.PI * 2, false);
    c.fillStyle = "#C73A41"
    c.fill();
  }


  image.src = canvas.toDataURL()
  image.style.width = resizedWidth;
  image.style.height = resizedHeight;
  
  screenshotWrapper.appendChild(image)
  document.querySelector('#screenshotContainer').appendChild(screenshotWrapper)


  // TODO: this needs to be adjusted to set the width and height of the canvas container, which should be big enough to accommodate one or multiple screenshots
  // let canvasContainer = document.querySelector('#screenshotContainer')
  // canvasContainer.style.width = resizedWidth;
  // canvasContainer.style.height = resizedHeight;

  // really ugly, but couldn't get the real size including the borders. Alternative solution if I cared, reset css styling so margin and padding = 0
  // let windowHeight = document.documentElement.scrollHeight
  // myConsole.log(windowHeight)
  // let windowWidth = Math.floor(resizedWidth * 1.1)
  // currentWindow.setSize(windowWidth, windowHeight)
  // currentWindow.center()
  
  video.remove()
}

function handleError(e) {
  console.log(e)
}


// APP INTERACTION
let stressRadioButtons = document.querySelectorAll("#stressedLikert input")
let creativityRadioButtons = document.querySelectorAll("#creativeLikert input")

creativityRadioButtons.forEach((radioButton) => {
  radioButton.addEventListener('click', (e) => {
    console.log('creativity clicked')
    checkIfRadioButtonChecked(stressRadioButtons)
  });
});

stressRadioButtons.forEach((radioButton) => {
  radioButton.addEventListener('click', (e) => {
    console.log('stress clicked')
    checkIfRadioButtonChecked(creativityRadioButtons)
  });
});

function checkIfRadioButtonChecked(likert) {
  console.log('check radio buttons')

  likert.forEach((radioButton) => {
    if (radioButton.checked) {
      console.log('both checked')
      getData()
      return
    }
  })
}

function getData() {
  myConsole.log('data being gotten')
  let creativityScore;
  let stressScore;

  let radioButtons = document.querySelectorAll('input')
  radioButtons.forEach((radioButton) => {
    if (radioButton.name === "creative" && radioButton.checked) {
      creativityScore = radioButton.value
      return
    }

    if (radioButton.name === "stressed" && radioButton.checked) {
      stressScore = radioButton.value
      return
    }
  })

  let screenshots = document.querySelectorAll('.screenshot')
  myConsole.log(screenshots.length)
  let screenshotsBase64 = []
  for (i=0; i<screenshots.length;i++) {
    console.log('data being processed')
  // let imageDataBase64 = imageContainer.src.replace(/^data:image\/png;base64,/, "");
    let imageDataBase64 = screenshots[i].querySelector('img').src
    let annotationCanvas = screenshots[i].querySelector('canvas').toDataURL()
  // let annotationCanvasDataBase64 = annotationCanvasData.replace(/^data:image\/png;base64,/, "");
    let dataObject = {screenshotBase64: imageDataBase64, annotationBase64: annotationCanvas}
    screenshotsBase64.push(dataObject)
  }
  
  
  saveData(false, screenshotsBase64, creativityScore, stressScore)
}

function notNow() {
  saveData(true)
}

function saveData(skipped, screenshotArray, creativityScore, stressScore) {
  const time = Date.now()

  let data = {
    "participantId": participantId,
    "sampleTimestamp": time,
    "skipped": skipped,
    "screenshots": screenshotArray,
    "creativityScore": creativityScore,
    "stressScore": stressScore
  }
  fs.writeFile('./data/' + participantId + '-' + time + '.json', JSON.stringify(data), 'utf8', (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });

  fetch('https://desktopesm.herokuapp.com/submit-data', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { "Content-type": "application/json; charset=UTF-8" }
  }).then(function (response) {
    // check for response, otherwise try again?

  })

  hide()
  sendMessageToMain()
}

function hide() {
  const currentWindow = remote.getCurrentWindow()
  console.log(currentWindow)
  currentWindow.hide()
}

// Not now button
let notNowButton = document.querySelector("#notNow");
notNowButton.addEventListener('click', notNow);


function sendMessageToMain() {
  ipcRenderer.send('sendMainMessage', {
    message: 'start countdown'
  });
}

// feature list:
  // JONAS
  // Center all content vertically and horizontally -- wait for full screen
  // 
  // 
  //
  // 
  //  
  //  
  //   
  //   
  //  
  //  - add option for participants to indicate starting + ending time of sampling
     
  // Packaging stuff:
  //  - give name to app
  //  - make work with catalina privacy settings (test whether it asks permissions for our app specifically)
  //  - installer

  // MIDAS:
  // Might be an upload problem with heroku: https://devcenter.heroku.com/articles/request-timeout#uploading-large-files
  // the window shouldn't pop up until all content is done loading. Right now the extra screenshots get added later..
  // Add check that picture is annotated before hiding popup
  // stress test server: make sure it has try/catch and doesn't crash easily
  // retry posting data (wait for server response)
  // add a timeout for sampling if no answer received
  // add check that it isn't sampling on the weekend
  // test autostart
  // Make pop-up window full sized (main.js)
  // make setup screen hideable (so participants can go find their prolific ID)
  // Hide app in dock; show in tray > make tray contextual menu only about closing
  
  // heroku downtime notifier
  // atlas mongodb downtime notifier
  // upgrade heroku & mongodb


  // PROLIFIC/SURVEY XACT
  // Disclaimer that they are able to share at least 30% of their work
  // Training screenshots
  // GPDR etc etc
  // test across platforms
