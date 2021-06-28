const socket = io({transports: ['websocket'], upgrade: false}) //server set up
/*
{transports: ['websocket'], upgrade: false}
*/

var stop_video = document.getElementById('video');
var stop_mic = document.getElementById('mic');
var icon_video = document.querySelector('.bi-camera-video');
var icon_mic = document.querySelector('.bi-mic');
var videoGrid = document.getElementById('video-grid');
const end = document.getElementById('end_call');
var vid_text = document.getElementById('vid_text');
var mic_text = document.getElementById('mic_text');
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
  stop_video.addEventListener("click",()=>{
    toggleVideo(stream);
  });
  stop_mic.addEventListener("click",()=>{
    toggleMic(stream);
  });
  myPeer.on('call', call => { //when someone joins the video send him your stream so you can see their video stream
    call.answer(stream)
    const video = document.createElement('video')
    socket.on('user_left',userId => {
      
      video.remove()
      var i = 0;
      while(i<1){
       location.reload();
       i++;
      }
   })
   
    call.on('stream', userVideoStream => {
     addVideoStream(video, userVideoStream)
     //add their video to the video stream
      //  call.on('close', () => {//remove the video if user leave the call

      //   videoGrid.removeChild(video);
      //   video.remove()
      // })
    });
    // socket.on('user_left',userId => {
      
    //   video.remove()
    // })
  });//receive calls



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
  // socket.on('user_left',userId => {
  
  //   video.remove()
  // })
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)// call the user and send him our video stream
  const video = document.createElement('video')
  call.on('stream', userVideoStream => { //listen to the call and add your video 
    addVideoStream(video, userVideoStream)
    socket.on('user_left',userId => {
    
      video.remove()
    })
  })//make calls
  // call.on('close', () => {               //remove the video if user leave the call
  //   videoGrid.removeChild(video);
  //   video.remove();
  // })
  // socket.on('user_left',userId => {
    
  //   video.remove()
  // })


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

function toggleVideo(stream) {
  stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled ;
  if(!stream.getVideoTracks()[0].enabled){
    icon_video.style.color = "red";
    stop_video.style.backgroundColor = "white";
    icon_video.style.transition = "0.2s ease-in";
    stop_video.style.transition = "0.2s ease-in";
    vid_text.innerHTML = "Start Video";
  }
  else{
    icon_video.style.color = "white";
    stop_video.style.backgroundColor = "transparent";
    icon_video.style.transition = "0.2s ease-in";
    stop_video.style.transition = "0.2s ease-in";
    vid_text.innerHTML = "Stop Video";
  }

}

function toggleMic(stream) {

  stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
  if(stream.getAudioTracks()[0].enabled==false){
    icon_mic.style.color = "red";
    stop_mic.style.backgroundColor = "white";
    icon_mic.style.transition = "0.2s";
    stop_mic.style.transition = "0.2s";
    mic_text.innerHTML = "Unmute";
    console.log("unmute")
  }
  else{
    icon_mic.style.color = "white";
    stop_mic.style.backgroundColor = "transparent";
    icon_mic.style.transition = "0.2s";
    stop_mic.style.transition = "0.2s";
    mic_text.innerHTML = "Mute";
    console.log('mute')
  }
}