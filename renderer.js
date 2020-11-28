const fs = require('fs')

// TAKING SCREENSHOT
// Video stream
const { desktopCapturer } = require('electron')
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
    function addCircle(e) {
      console.log('canvas clicked')
      let c = canvasOverlay.getContext('2d');
      let bounds = e.target.getBoundingClientRect();
      let x = e.clientX - bounds.left;
      let y = e.clientY - bounds.top;

      console.log(bounds, x, y)

      c.beginPath();
      c.arc(x,y,10,0,Math.PI*2,false);
      c.fillStyle ="red"
      c.fill();
    }

    canvasOverlay.addEventListener('click', addCircle)

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

  

// feature list:
  // Work for two screens
  
  // run in background
  // closing when clicked
  // pop up with timing
  
  // setup screen: instructions
  // sending data
  // error log
  // installer


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
      saveData(true)
      minimiseToTray()
      return
    }
  })
}

function saveData(includeScreenshot) {
  let participantId = '0';

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

  let time = Date.now()
  let imageDataBase64;
  let annotationCanvasDataBase64;
  if (includeScreenshot) {
    let imageContainer = document.querySelector('#screenshot')
    imageDataBase64 = imageContainer.src.replace(/^data:image\/png;base64,/, "");

    let annotationCanvas = document.querySelector('#screenshotContainer canvas');
    let annotationCanvasData = annotationCanvas.toDataURL()
    annotationCanvasDataBase64 = annotationCanvasData.src.replace(/^data:image\/png;base64,/, "");
  }

  let data = {
    "participantId": participantId,
    "screenshot": imageDataBase64,
    "annotation": annotationCanvasDataBase64,
    "creativityScore": creativityScore,
    "stressScore": stressScore
  }

  fs.writeFile('./data/'+participantId+time+'.json', JSON.stringify(data), 'utf8', (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
}

const { remote } = require('electron')
function minimiseToTray() {
  console.log(remote)
  // BrowserWindow.getFocusedWindow().minimize();
}

// Not now button
let notNowButton = document.querySelector("#notNow");
notNowButton.addEventListener('click', saveData(false));

