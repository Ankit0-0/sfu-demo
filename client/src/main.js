const mediasoup = require("mediasoup-client");
const { v4: uuidV4 } = require("uuid");

let btnSub,
  btnCam,
  btnScreen,
  btnConnect,
  btnDisconnect,
  textPublish,
  textWebcam,
  textScreen,
  textSubscribe,
  textConn,
  localVideo,
  remoteVideo,
  producer,
  consumeTransport,
  userId,
  isWebcam = true,
  produceCallback,
  produceErrback,
  consumerCallback,
  consumerErrback;

const websocketURL = "ws://localhost:8000/ws";
let socket, device;

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

  btnCam.addEventListener("click", publish);
  btnScreen.addEventListener("click", publish);
  btnSub.addEventListener("click", () => console.log("sub btn clicked"));
});

const connect = () => {
  socket = new WebSocket(websocketURL);
  socket.onopen = () => {
    const msg = {
      type: "getRouterRtpCapabilities",
    };
    const resp = JSON.stringify(msg);
    socket.send(resp);
  };

  socket.onmessage = (event) => {
    const jsonValidation = IsJsonString(event.data);

    if (!jsonValidation) {
      log.error("Received invalid JSON message");
      return;
    }

    let resp = JSON.parse(event.data);

    switch (resp.type) {
      case "routerRtpCapabilities":
        onRouterRtpCapabilities(resp.data);
        break;
      case "producerTransportCreated":
        onProducerTransportCreated(resp.data);
        break;
      case "producerTransportCreationFailed":
        onProducerTransportCreationFailed(resp.data);
        break;
      default:
        console.log(`Unknown message type: ${resp.type}`);
        break;
    }
  };
};

connect();

const onRouterRtpCapabilities = (data) => {
  loadDevice(data)
    .then(() => {
      console.log("Device loaded successfully");
      // Enable UI buttons here
      btnCam.disabled = false;
      btnScreen.disabled = false;
    })
    .catch((error) => {
      console.error("Error loading device:", error);
    });
};

const onProducerTransportCreated = async (event) => {
  if (event.error) {
    console.error("Producer transport creation failed:", event.error);
    return;
  }

  const transport = device.createSendTransport(event.data);

  transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    const message = {
      type: "connectProducerTransport",
      dtlsParameters,
    };

    const resp = JSON.stringify(message);
    socket.send(resp);
    socket.addEventListener("producerTransportConnected", (event) => {
      callback();
    });
  });

  // begin transport on producer
  transport.on(
    "produce",
    async ({ kind, rtpParameters }, callback, errback) => {
      const message = {
        type: "produce",
        kind,
        rtpParameters,
      };
      const resp = JSON.stringify(message);
      socket.send(resp);

      socket.addEventListener("produced", (event) => {
        // published
        callback(resp.data.id);
      });
    },
  );

  // end transport producer
  // connection state change begin
  transport.on("connectionstatechange", (state) => {
    switch (state) {
      case "connecting":
        textPublish.innerHTML = "Publishing... (connecting)";
        break;
      case "connected":
        localVideo.srcObject = stream;
        textPublish.innerHTML = "published... (connected)";
        break;
      case "failed":
        textPublish.innerHTML = "Publishing failed... (failed)";
        transport.close();
        break;
    }
  });

  // connection state change end
  let stream;
  try {
    stream = await getUserMedia();
    const track = stream.getVideoTracks()[0];
    const params = { track };
    producer = await transport.produce(params);
  } catch (error) {
    console.error("Error producing media:", error);
    textPublish.innerHTML = "Publishing failed... (error)";
  }
};

const onProducerTransportCreationFailed = (event) => {
  console.error("Producer transport creation failed:", event.error);
};

const loadDevice = async (routerRtpCapabilities) => {
  try {
    device = new mediasoup.Device();
  } catch (error) {
    if (error.name === "UnsupportedError")
      console.error("Browser not supported for mediasoup");
    else console.error("Error loading device:", error);
  }

  await device.load({ routerRtpCapabilities });
};

const publish = (event) => {
  isWebcam = event.target.id === "btn_webcam";
  textPublish = isWebcam ? textWebcam : textScreen;
  btnScreen.disabled = true;
  btnCam.disabled = true;

  const message = {
    type: "createProducerTransport",
    forceTcp: false,
    rtpCapabilities: device.rtpCapabilities,
  };

  const resp = JSON.stringify(message);
  socket.send(resp);
};

const IsJsonString = (str) => {
  try {
    JSON.parse(str);
  } catch (error) {
    return false;
  }
  return true;
};

const getUserMedia = async () => {
  if (!device.canProduce("video")) {
    console.error("Cannot produce video");
    return;
  }
  let stream;
  try {
    stream = isWebcam
      ? await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
      : await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
  } catch (error) {
    console.error("Error accessing media devices:", error);
    throw error;
  }
  return stream;
};
