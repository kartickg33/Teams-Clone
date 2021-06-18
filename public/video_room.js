const socket = io('127.0.0.1:3300') //server set up at rooms path
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, { //create connections between different users using  Web RTC
  host: '/',// let server create own id in above line using undefined
  port: '3301'
})
const myVideo = document.createElement('video')
myVideo.muted = true //dont want to hear own voice
const peers = {} //store user data in call
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => { //when someone joins the video sen him your stream so you can see their video stream
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream) //add their video to the video stream
    })
  })//recieve calls

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)// new user has joined the call so send the video stream to the user
    console.log("user connected: " + userId);
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
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
  call.on('close', () => {//remove the video if user leave the call
    video.remove()
  })

  peers[userId] = call //store the user data in the object
}

function addVideoStream(video, stream) {//stream==video call | add our video on the grid call
  video.srcObject = stream 
  video.addEventListener('loadedmetadata', () => {
    video.play() // load the video stream and play your video
  })
  videoGrid.append(video)
}