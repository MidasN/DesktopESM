const fs = require('fs')

const { desktopCapturer, ipcRenderer, remote } = require('electron')
const glob = require('glob')
const path = require('path');

const fileName = glob.sync(path.join(__dirname, './data/*-setup.json'))

///note to self: this is wher its broken->
const setupData = fs.readFileSync(fileName[0])

const participantId = JSON.parse(setupData).participantId
const currentWindow = remote.getCurrentWindow()
let nodeConsole = require('console');
let myConsole = new nodeConsole.Console(process.stdout, process.stderr);
const currentWidth = currentWindow.getSize()[0];
const currentHeight = currentWindow.getSize()[1];


// defining new fetch function that retries on failure
const fetchPlus = (url, options = {}, retries) =>
  fetch(url, options)
    .then(res => {
      if (res.ok) {
        myConsole.log('sample data sucessfully POSTed to database')
        return
      }
      if (retries > 0) {
        myConsole.log('ERROR: retrying POSTing data to database')
        return setTimeout(fetchPlus, 10000, url, options, retries - 1)
      }
      throw new Error(res.status)
    })
    .catch(error => myConsole.error(error.message))

// TAKING SCREENSHOT
// Video stream
let numberOfScreens = 0;

desktopCapturer.getSources({ types: ['screen'] }).then(async sources => {
  myConsole.log("Number of screens detected: " + sources.length);
  numberOfScreens = sources.length;

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
            minHeight: currentHeight
          }
        }
      })
      handleStream(stream, id)
    } catch (e) {
      myConsole.log("ERROR: Processing screen: ", e);
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
  })
  
  let target = document.querySelector('#videoContainer')
  target.appendChild(video)
}

let numberOfScreenshotsAdded = 0;

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
  canvasOverlay.addEventListener('click', 
    function (e) {
      console.log('canvas clicked')
      document.querySelector('.annotatetext').style.opacity = 0;
      document.getElementById('likerts').classList.add('show');
    
      let c = canvasOverlay.getContext('2d');
      let bounds = e.target.getBoundingClientRect();
      let x = e.clientX - bounds.left;
      let y = e.clientY - bounds.top;
    
      c.beginPath();
      c.arc(x, y, 10, 0, Math.PI * 2, false);
      c.fillStyle = "#C73A41"
      c.fill();
      
      checkIfRequirementsMet()
    })

  image.src = canvas.toDataURL()
  image.style.width = resizedWidth;
  image.style.height = resizedHeight;
  
  screenshotWrapper.appendChild(image)
  document.querySelector('#screenshotContainer').appendChild(screenshotWrapper)
  numberOfScreenshotsAdded++

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
  showWindow()
  // Start the timeout for when to hide the pop-up if not answered
  setAnswerTimeout()
}

function showWindow() {
  if (numberOfScreenshotsAdded === numberOfScreens) {
    currentWindow.show()
  }
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
    checkIfRequirementsMet(stressRadioButtons)
  });
});

stressRadioButtons.forEach((radioButton) => {
  radioButton.addEventListener('click', (e) => {
    console.log('stress clicked')
    checkIfRequirementsMet(creativityRadioButtons)
  });
});

function checkIfRequirementsMet() {
  console.log('check radio buttons & canvas')
  let canvasAnnotated = checkIfCanvasAnnotated()
  let stressChecked = checkIfRadioButtonsChecked(stressRadioButtons)
  let creativityChecked = checkIfRadioButtonsChecked(creativityRadioButtons)

  console.log(canvasAnnotated, stressChecked, creativityChecked)
  if (canvasAnnotated && stressChecked && creativityChecked) {
    console.log('get data')
    
    getData()
    
  }
}

function checkIfRadioButtonsChecked(likert) {
  let checked = false
  likert.forEach((radioButton) => {
    if (radioButton.checked) {
      console.log('both checked')
      checked = true
      return
    }
  })
  return checked
}

function checkIfCanvasAnnotated() {
  let canvasses = document.querySelectorAll('canvas')

  let doesCanvasHaveContent = false;

  for (canvas of canvasses) {
    if (doesCanvasHaveContent === false) {
      const context = canvas.getContext('2d');
      console.log(context)
      const pixelBuffer = new Uint32Array(
        context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
      );
      doesCanvasHaveContent = pixelBuffer.some(color => color !== 0);
    }
  }
  
  return doesCanvasHaveContent
  
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
  fs.writeFile(path.join(__dirname, './data/' + participantId + '-' + time + '.json'), JSON.stringify(data), 'utf8', (err) => {
    if (err) throw err;
    console.log('The sample file has been saved!');
  });

  fetchPlus('https://desktopesm.herokuapp.com/submit-data', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { "Content-type": "application/json; charset=UTF-8" }
  }, 4)

  clearAnswerTimeout()
  hide()
  sendMessageToMain()
}

function hide() {
  // const currentWindow = remote.getCurrentWindow()
  // console.log(currentWindow)
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

let answerTimeout;

function setAnswerTimeout() {
  myConsole.log('timeout set')
  answerTimeout = setTimeout(function() {
    if (currentWindow.isVisible()) {
      myConsole.log('NO ANSWER: timed out')
      hide()
      sendMessageToMain()
    }
  }, 600000)
}

function clearAnswerTimeout() {
  myConsole.log('ANSWERED: timeout cleared')
  clearTimeout(answerTimeout)
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
  //  - add logo to app

  // MIDAS:
  // Make pop-up window full sized (main.js)
  // Add check that picture is annotated before hiding popup
  // make setup screen hideable (so participants can go find their prolific ID)
  // add check that it isn't sampling on the weekend
  // add a timeout for sampling if no answer received
  // make annotation check work for multiple screens
  // the window shouldn't pop up until all content is done loading. Right now the extra screenshots get added later..
  // retry posting data (wait for server response)
  // Might be an upload problem with heroku: https://devcenter.heroku.com/articles/request-timeout#uploading-large-files
  
  // Hide app in dock; show in tray > make tray contextual menu only about closing
  // Add 'about' option to tray menu 
  // Add 'show' option to tray menu when it is in background

  // test autostart
  // stress test server: make sure it has try/catch and doesn't crash easily
  // heroku downtime notifier
  // atlas mongodb downtime notifier
  // upgrade heroku & mongodb

  // PROLIFIC/SURVEY XACT
  // Disclaimer that they are able to share at least 30% of their work
  // Training screenshots
  // GPDR etc etc
  // test across platforms
