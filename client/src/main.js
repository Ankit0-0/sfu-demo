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
  consumeTransport,
  isWebcam = true,
  remoteStream;

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
  // roomIdInput = document.getElementById("roomId");
  // peerNameInput = document.getElementById("peerName");

  console.log("✅ UI elements loaded");

  // Optional: enable connect button immediately
  //   btnConnect.disabled = false;

  btnCam.addEventListener("click", publish);
  btnScreen.addEventListener("click", publish);
  btnSub.addEventListener("click", subscribe);
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
      case "consumerTransportCreated":
        onConsumerTransportCreated(resp);
        break;
      case "subscribed":
        onSubscribed(resp);
        break;
      case "resumed":
      case "produced":
        if (pendingProduceCallback) {
          pendingProduceCallback({ id: resp.data.id });
          pendingProduceCallback = null;
        }
        break;
        console.log(resp.data, "resumed");
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

  const transport = device.createSendTransport(event);

  transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    const message = {
      type: "connectProducerTransport",
      dtlsParameters,
    };

    const resp = JSON.stringify(message);
    socket.send(resp);
    socket.addEventListener("message", (event) => {
      console.log("Received message for connectProducerTransport:", event.data);
      const jsonValidation = IsJsonString(event.data);

      if (!jsonValidation) {
        log.error("Received invalid JSON message");
        return;
      }

      let resp = JSON.parse(event.data);

      if (resp.type == "producerTransportConnected") {
        // producerConnected
        console.log("Producer transport connected successfully");
        callback();
      }
    });
    // callback();
  });

  // begin transport on producer
  let pendingProduceCallback = null;

  transport.on(
    "produce",
    async ({ kind, rtpParameters }, callback, errback) => {
      try {
        pendingProduceCallback = callback;

        socket.send(
          JSON.stringify({
            type: "produce",
            kind,
            rtpParameters,
          }),
        );
      } catch (error) {
        errback(error);
      }
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
    localVideo.srcObject = stream;
    const track = stream.getVideoTracks()[0];
    const params = { track };

    console.log("STREAM:", stream);
    console.log("TRACKS:", stream.getTracks());

    await localVideo.play().catch((e) => console.error("Play error:", e));
    producer = await transport.produce(params);
  } catch (error) {
    console.error("Error producing media:", error);
    textPublish.innerHTML = "Publishing failed... (error)";
  }
};

const onProducerTransportCreationFailed = (event) => {
  console.error("Producer transport creation failed:", event.error);
};

const onConsumerTransportCreated = (event) => {
  if (event.error) {
    console.error("Consumer transport creation failed:", event.error);
    return;
  }

  const transport = device.createRecvTransport(event.data);
  transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    const message = {
      type: "connectConsumerTransport",
      dtlsParameters,
      transportId: transport.id,
    };

    const resp = JSON.stringify(message);
    socket.send(resp);

    socket.addEventListener("message", (event) => {
      console.log("Received message for consumer Connected:", event.data);
      const jsonValidation = IsJsonString(event.data);

      if (!jsonValidation) {
        log.error("Received invalid JSON message");
        return;
      }

      let resp = JSON.parse(event.data);
      btnSub.disabled = false;

      if (resp.type === "consumerConnected") {
        console.log("Consumer transport connected successfully");
        callback();
      }
    });
  });

  transport.on("connectionstatechange", (state) => {
    switch (state) {
      case "connecting":
        textSubscribe.innerHTML = "Subscribing";
        break;
      case "connected":
        remoteVideo.srcObject = remoteStream;
        btnSub.disabled = false;
        const msg = {
          type: "resume",
        };
        const resp = JSON.stringify(msg);
        socket.send(resp);
        textSubscribe.innerHTML = "subscribed";
        break;
      case "failed":
        transport.close();
        textSubscribe.innerHTML = "failed";
        btnSub.disabled = false;
        break;
    }
  });

  consumeTransport = transport;

  const stream = consume(transport); // consumer
};

const consume = async (transport) => {
  const { rtpCapabilities } = device;
  const msg = {
    type: "consume",
    rtpCapabilities,
  };
  const message = JSON.stringify(msg);

  socket.send(message);
};

const onSubscribed = async (event) => {
  const data = ({ producerId, id, kind, rtpParameters } = event.data);

  let codecOptions = {};
  const consumer = await consumeTransport.consume({
    id,
    producerId,
    kind,
    rtpParameters,
    codecOptions,
  });
  const stream = new MediaStream();
  stream.addTrack(consumer.track);

  remoteStream = stream;
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

const subscribe = () => {
  btnSub.disabled = true;

  const msg = {
    type: "createConsumerTransport",
    forceTcp: false,
    // rtpCapabilities: device.rtpCapabilities,
  };

  const resp = JSON.stringify(msg);
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
          audio: false,
        })
      : await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
  } catch (error) {
    console.error("Error accessing media devices:", error);
    throw error;
  }
  return stream;
};
