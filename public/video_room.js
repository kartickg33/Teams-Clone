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


  myPeer.on('call', call => { //when someone joins the video send him your stream so you can see their video stream
    call.answer(stream)
    const video = document.createElement('video')

    call.on('stream', userVideoStream => {
     addVideoStream(video, userVideoStream)
     call.on('close', () => {               //remove the video if user leave the call
      video.remove();
      // socket.emit('leave-room',ROOM_ID);
      });
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
  });
  // socket.on('user-left',user_name=>{
  //   video.remove();
  // });
  
});

myPeer.on('open', id => {//create a new user id and let your peer join the room...
  socket.emit('join-room', ROOM_ID, id);  
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)// call the user and send him our video stream
  const video = document.createElement('video')
  // video.setAttribute('id',userId);
  call.on('stream', userVideoStream => { //listen to the call and add your video
    addVideoStream(video, userVideoStream)
  });
  //make calls
  call.on('close', () => {               //remove the video if user leave the call
    video.remove();
    // socket.emit('leave-room',ROOM_ID,userId);
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

function toggleVideo(stream) {
  stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled ;
  if(!stream.getVideoTracks()[0].enabled){
    video_change.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 0 24 24" width="36px" fill="#FFFFFF"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M9.56 8l-2-2-4.15-4.14L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21l1.41-1.41-8.86-8.86L9.56 8zM5 16V8h1.73l8 8H5zm10-8v2.61l6 6V6.5l-4 4V7c0-.55-.45-1-1-1h-5.61l2 2H15z"/></svg>`;
    stop_video.style.backgroundColor = "red";
    document.querySelector('svg').style.transition = "0.2s ease-in";
    stop_video.style.transition = "0.2s ease-in";
  }
  else{
    video_change.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 0 24 24" width="36px" fill="#FFFFFF"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z"/></svg>`;
    stop_video.style.backgroundColor = "#147502";
    document.querySelector('.bi-camera-video').style.transition = "0.2s ease-in";
    stop_video.style.transition = "0.2s ease-in";
  }

}

function toggleMic(stream) {

  stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
  if(stream.getAudioTracks()[0].enabled==false){
    mic_change.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 0 24 24" width="36px" fill="#FFFFFF"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M10.8 4.9c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2l-.01 3.91L15 10.6V5c0-1.66-1.34-3-3-3-1.54 0-2.79 1.16-2.96 2.65l1.76 1.76V4.9zM19 11h-1.7c0 .58-.1 1.13-.27 1.64l1.27 1.27c.44-.88.7-1.87.7-2.91zM4.41 2.86L3 4.27l6 6V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.55-.9l4.2 4.2 1.41-1.41L4.41 2.86z"/></svg>`;
    stop_mic.style.backgroundColor = "red";
    document.querySelector('svg').style.transition = "0.2s ease-in";
    stop_mic.style.transition = "0.2s ease-in";
  }
  else{
    mic_change.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="36px" viewBox="0 0 24 24" width="36px" fill="#FFFFFF"><g><rect fill="none" height="24" width="24"/><rect fill="none" height="24" width="24"/><rect fill="none" height="24" width="24"/></g><g><g/><g><path d="M12,14c1.66,0,3-1.34,3-3V5c0-1.66-1.34-3-3-3S9,3.34,9,5v6C9,12.66,10.34,14,12,14z"/><path d="M17,11c0,2.76-2.24,5-5,5s-5-2.24-5-5H5c0,3.53,2.61,6.43,6,6.92V21h2v-3.08c3.39-0.49,6-3.39,6-6.92H17z"/></g></g></svg>`;
    stop_mic.style.backgroundColor = "#147502";
    document.querySelector('svg').style.transition = "0.2s ease-in";
    stop_mic.style.transition = "0.2s ease-in";
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
});

socket.on('receive-msg', val =>{
  adduser(`${val.name}: ${val.msg}`,'left');
});

socket.on('user-left',user_name=>{
  adduser(`${user_name} left the chat`,'left');
});
