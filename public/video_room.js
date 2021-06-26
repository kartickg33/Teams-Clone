const socket = io({transports: ['websocket'], upgrade: false}) //server set up
/*
{transports: ['websocket'], upgrade: false}
*/

var stop_video = document.getElementById('stop_video')
var stop_mic = document.getElementById('stop_mic')
var videoGrid = document.getElementById('video-grid')
const end = document.getElementById('end_call')
var mic_switch = true;
var video_switch = true;

var myPeer = new Peer()//create connections between different users using  Web RTC
const myVideo = document.createElement('video')
myVideo.muted = true //dont want to hear own voice
const peers = {} //store user data in call
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => { //when someone joins the video send him your stream so you can see their video stream
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
     addVideoStream(video, userVideoStream) //add their video to the video stream
    //  call.on('close', () => {//remove the video if user leave the call

    //   videoGrid.removeChild(video);
    //   video.remove()
    // })
    socket.on('user_left',userId => {
      
      video.remove()
    })
      stop_video.addEventListener("click",()=>{
        toggleVideo(stream);
      });
      stop_mic.addEventListener("click",()=>{
        toggleMic(stream);
      });
    })
    stop_video.addEventListener("click",()=>{
      toggleVideo(stream);
    });
    stop_mic.addEventListener("click",()=>{
      toggleMic(stream);
    });
    // socket.on('user_left',userId => {
      
    //   video.remove()
    // })
  })//receive calls



  // socket.on('user_left',userId => {
  //   video.remove()
  // })
  socket.on('user_joined', userId => {
    console.log("user connected: " + userId);
    connectToNewUser(userId, stream)// new user has joined the call so send the video stream to the user
  })
  // socket.on('user_left',userId => {
  //   video.remove()
  // })
  
})

myPeer.on('open', id => {//create a new user id and let your peer join the room...
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)// call the user and send him our video stream
  const video = document.createElement('video')
  call.on('stream', userVideoStream => { //listen to the call and add your video 
    addVideoStream(video, userVideoStream)
  })//make calls
  // call.on('close', () => {               //remove the video if user leave the call
  //   videoGrid.removeChild(video);
  //   video.remove();
  // })
  socket.on('user_left',userId => {
    
    video.remove()
  })
  stop_video.addEventListener('click',()=>{
    toggleVideo(stream);
  });
  stop_mic.addEventListener('click',()=>{
    toggleMic(stream);
  });


  peers[userId] = call //store the user data in the object
}


function addVideoStream(video, stream) {//stream==video call | add our video on the grid call
  video.srcObject = stream 
  video.addEventListener('loadedmetadata', () => {
    video.play() // load the video stream and play your video
  })
  videoGrid.appendChild(video)
}

function end_call(){
  
}

var webcam = true;
function toggleVideo(stream) {
  if(stream != null && stream.getVideoTracks().length > 0){
    video_switch = !video_switch;

    stream.getVideoTracks()[0].enabled = video_switch;
    if(webcam){
      stream.getTracks()[0].stop();
      webcam = false;
    }
    else{
      stream.getTracks()[0].play();
      webcam = true;
    }
  }

}

function toggleMic(stream) {
  if(stream != null && stream.getAudioTracks().length > 0){
    mic_switch = !mic_switch;

    stream.getAudioTracks()[0].enabled = mic_switch;
  }
}