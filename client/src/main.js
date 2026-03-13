const mediasoup = require("mediasoup-client");
const { v4: uuidV4 } = require("uuid");

let btnSub,
  btnCam,
  btnScreen,
  btnConnect,
  btnDisconnect,
  textWebcam,
  textScreen,
  textSubscribe,
  textConn,
  localVideo,
  remoteVideo,
  device,
  producer,
  consumeTransport,
  userId,
  isWebcam = true,
  produceCallback,
  produceErrback,
  consumerCallback,
  consumerErrback;

const websocketURL = "ws://localhost:8000/ws";
let socket;

document.addEventListener("DOMContentLoaded", () => {
  // Buttons
  btnCam = document.getElementById("btn_webcam");
  btnScreen = document.getElementById("btn_screen");
  btnSub = document.getElementById("btn_subscribe");
  btnConnect = document.getElementById("btn_connect");
  btnDisconnect = document.getElementById("btn_disconnect");

  // Status text
  textWebcam = document.getElementById("webcam_status");
  textScreen = document.getElementById("screen_status");
  textSubscribe = document.getElementById("subscribe_status");
  textConn = document.getElementById("conn_status");

  // Video elements
  localVideo = document.getElementById("localVideo");
  remoteVideo = document.getElementById("remoteVideo");

  // Inputs
  roomIdInput = document.getElementById("roomId");
  peerNameInput = document.getElementById("peerName");

  console.log("✅ UI elements loaded");

  // Optional: enable connect button immediately
//   btnConnect.disabled = false;

  btnCam.addEventListener("click", console.log("cam btn clicked"));
  btnScreen.addEventListener("click", console.log("clicked publish screen"));
  btnSub.addEventListener("click", console.log("sub btn clicked"));
});


const connect = () => {
    socket = new WebSocket(websocketURL);
    socket.onopen = () => {
        const msg = {
            type: "getRouterRtpCapabilities"
        }
        const resp = JSON.stringify(msg);
        socket.send(resp);
    }
}

connect()