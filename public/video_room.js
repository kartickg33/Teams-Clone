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
var mic_change = document.getElementById('mic_change');
var video_change = document.getElementById('video_change');

var myPeer = new Peer()//create connections between different users using  Web RTC
const myVideo = document.createElement('video')
myVideo.muted = true //dont want to hear own voice
const peers = {} //store user data in call
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {

  addVideoStream(myVideo, stream)
  stream.getAudioTracks()[0].enabled = false;
  stream.getVideoTracks()[0].enabled = false;
  stop_video.addEventListener("click",()=>{
    toggleVideo(stream);
  });
  stop_mic.addEventListener("click",()=>{
    toggleMic(stream);
  });

  socket.on('user_left',userId=>{
    video.remove()
    var i = 0;
    while(i<1){
      location.reload();
      i++;
    }
  })

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
  });//receive calls

  socket.on('user_joined', userId => {
    console.log("user connected: " + userId);
    connectToNewUser(userId, stream)// new user has joined the call so send the video stream to the user
  })
})

myPeer.on('open', id => {//create a new user id and let your peer join the room...
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)// call the user and send him our video stream
  const video = document.createElement('video')
  // video.setAttribute('id',userId);
  call.on('stream', userVideoStream => { //listen to the call and add your video
    addVideoStream(video, userVideoStream)
  })
  //make calls
  call.on('close', () => {               //remove the video if user leave the call
    video.remove();
  })
  peers[userId] = call //store the user data in the object
}


function addVideoStream(video, stream) {//stream==video call | add our video on the grid call
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play() // load the video stream and play your video
  })
  videoGrid.appendChild(video)
}

function toggleVideo(stream) {
  stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled ;
  if(!stream.getVideoTracks()[0].enabled){
    video_change.innerHTML = `<i class="bi bi-camera-video-off" id="icon"></i>`;
    document.querySelector('.bi-camera-video-off').style.color = "white";
    stop_video.style.backgroundColor = "red";
    document.querySelector('.bi-camera-video-off').style.transition = "0.2s ease-in";
    stop_video.style.transition = "0.2s ease-in";
  }
  else{
    video_change.innerHTML = `<i class="bi bi-camera-video" id="icon"></i>`
    document.querySelector('.bi-camera-video').style.color = "white";
    stop_video.style.backgroundColor = "#147502";
    document.querySelector('.bi-camera-video').style.transition = "0.2s ease-in";
    stop_video.style.transition = "0.2s ease-in";
  }

}

function toggleMic(stream) {

  stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
  if(stream.getAudioTracks()[0].enabled==false){
    mic_change.innerHTML = `<i class="bi bi-mic-mute" id="icon"></i>`
    document.querySelector('.bi-mic-mute').style.color = "white";
    stop_mic.style.backgroundColor = "red";
    document.querySelector('.bi-mic-mute').style.transition = "0.2s";
    stop_mic.style.transition = "0.2s";
    console.log("unmute")
  }
  else{
    mic_change.innerHTML = `<i class="bi bi-mic" id="icon"></i>`
    document.querySelector('.bi-mic').style.color = "white";
    stop_mic.style.backgroundColor = "#147502";
    document.querySelector('.bi-mic').style.transition = "0.2s";
    stop_mic.style.transition = "0.2s";
    console.log('mute')
  }
}

//-------------------------------------------CHAT ROOM---------------------------------------------------------------

const form = document.querySelector('#send_container');
const messageInp = document.querySelector('#messageInp');
const messageContainer = document.querySelector('.chat_container');

function adduser(msg, pos){
    const msgelement = document.createElement('div');
    msgelement.innerText = msg;
    msgelement.classList.add('message');
    msgelement.classList.add(pos);
    messageContainer.append(msgelement);
}

form.addEventListener('submit',(e)=>{
  e.preventDefault();
  const notif = messageInp.value;
  if(messageInp.value != ""){
    adduser(`You: ${notif}`,'right');
    socket.emit('send-msg',ROOM_ID, notif);
  }
  messageInp.value = "";

});

const name_val = prompt('Enter your name to join');
socket.emit('new-user-joined',ROOM_ID,name_val);

socket.on('user-joined',(user_name)=>{
    adduser(`${user_name} joined the chat`,'right');
})

socket.on('receive-msg', val =>{
  adduser(`${val.name}: ${val.msg}`,'left');
})

socket.on('user-left-chat',user_name=>{
  adduser(`${user_name} left the chat`,'left');
})



