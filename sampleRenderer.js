const fs = require('fs')
const { desktopCapturer, ipcRenderer, remote } = require('electron')
const setupData = fs.readFileSync('./data/participantSetup.json')
const participantId = JSON.parse(setupData).participantId

// TAKING SCREENSHOT
// Video stream
desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
  console.log(sources)
  let screen = sources[0]
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screen.id,
          minWidth: 1280,
          maxWidth: 2560,
          minHeight: 720,
          maxHeight: 1600
        }
      }
    })
    handleStream(stream)
  } catch (e) {
    handleError(e)
  }
  return
  })
  
  function handleStream (stream) {
    const video = document.querySelector('video')
    video.srcObject = stream
    video.onloadedmetadata = function(e) {
      video.play();
      createScreenshot()
      const currentWindow = remote.getCurrentWindow()
      currentWindow.show()
    } 
  }

  function createScreenshot () {
    const video = document.querySelector('video')
    const image = document.querySelector('#screenshot')

    canvas = document.createElement('canvas');
    let width = video.videoWidth;
    let height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    // canvas.getContext("2d").drawImage(video, 0, 0, width * 0.3, height * 0.3);
    canvas.getContext("2d").drawImage(video, 0, 0);
    
    let canvasOverlay = document.createElement('canvas')
    let resizeRatio = 0.3
    let resizedWidth = width * resizeRatio
    let resizedHeight = height *  resizeRatio
    canvasOverlay.width = resizedWidth
    canvasOverlay.height = resizedHeight
    document.querySelector("#screenshotContainer").append(canvasOverlay)
    
    // Annotate image
    canvasOverlay.addEventListener('click', addCircle)
    
    function addCircle(e) {
      console.log('canvas clicked')
      let c = canvasOverlay.getContext('2d');
      let bounds = e.target.getBoundingClientRect();
      let x = e.clientX - bounds.left;
      let y = e.clientY - bounds.top;

      c.beginPath();
      c.arc(x,y,10,0,Math.PI*2,false);
      c.fillStyle ="red"
      c.fill();
    }
    

    image.src = canvas.toDataURL()
    image.style.width = resizedWidth;
    image.style.height = resizedHeight;

    let canvasContainer = document.querySelector('#screenshotContainer')
    canvasContainer.style.width = resizedWidth;
    canvasContainer.style.height = resizedHeight;

  }

  function handleError (e) {
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
  
  let imageContainer = document.querySelector('#screenshot')
  let imageDataBase64 = imageContainer.src.replace(/^data:image\/png;base64,/, "");
  let annotationCanvas = document.querySelector('#screenshotContainer canvas');
  let annotationCanvasData = annotationCanvas.toDataURL()
  let annotationCanvasDataBase64 = annotationCanvasData.replace(/^data:image\/png;base64,/, "");

  saveData(false, imageDataBase64, annotationCanvasDataBase64, creativityScore, stressScore)
}

function notNow() {
  saveData(true)
}

function saveData(skipped, screenshot, annotation, creativityScore, stressScore) {
  const time = Date.now()

  let data = {
    "participantId": participantId,
    "sampleTimestamp": time,
    "skipped": skipped,
    "screenshot": screenshot,
    "annotation": annotation,
    "creativityScore": creativityScore,
    "stressScore": stressScore
  }
  fs.writeFile('./data/'+participantId+'-'+time+'.json', JSON.stringify(data), 'utf8', (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });

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
  // Test for two screens
  // test across platforms
  // make pop-up and content response to screen size
  // dock icon
  // styling of screen and questions
  // setup screen?
  // test across timezones
  // give name to app
  // make work with catalina privacy settings
  // test autostart
  // TODO: clicking not now, then calling it up again with the tray icon, then clicking not now again will launch 2 countdown processes..
  // sending data
  // log
  // installer

