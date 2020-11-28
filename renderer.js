const { desktopCapturer } = require('electron')
const fs = require('fs')

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
    const img = document.querySelector('#screenshot')

    canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    img.src = canvas.toDataURL();
  }

  function saveData() {
    let participantId = '0';
    let time = Date.now()
    let imageContainer = document.querySelector('#screenshot')
    let imageDataBase64 = imageContainer.src.replace(/^data:image\/png;base64,/, "");

    fs.writeFile('./data/'+participantId+time+'.png', imageDataBase64, 'base64', (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  }

  document.querySelector('#submitData').addEventListener('click', saveData)

  function handleError (e) {
    console.log(e)
  }

  

// feature list:
  // Work for two screens
  // run in background
  // pop up with timing
  // radio buttons + closing when clicked
  // not now button
  // saving data
  // setup screen: instructions
  // sending data
  // annotate images
  // processes/windows open
  // error log
  // installer