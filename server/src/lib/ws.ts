import WebSocket from "ws";
import { createWorker } from "./worker";
import { createLogger } from "./logger/logger";
import {
  Consumer,
  Producer,
  Router,
  RtpCapabilities,
  Transport,
} from "mediasoup/node/lib/types";
import { createWebrtcTransport } from "./createWebrtcTransport";

const log = createLogger({ module: "ws" });

let mediasoupRouter: Router;
let produceTransport: Transport;
let consumerTransport: Transport;
let producer: Producer;
let consumer: Consumer;

const WebsocketConnection = async (websock: WebSocket.Server) => {
  try {
    mediasoupRouter = await createWorker();
    log.info("Mediasoup router ready for WS layer");
  } catch (error) {
    log.error({ error }, "Failed to initialize Mediasoup");
    throw error;
  }
  websock.on("connection", (ws: WebSocket) => {
    log.info("New WebSocket connection established.");

    ws.on("message", (message: string) => {
      log.info(`Received message: ${message}`);
      //  ws.send(`Echo: ${message}`);

      const jsonValidation = IsJsonString(message);

      if (!jsonValidation) {
        log.error("Received invalid JSON message");
        return;
      }

      const event = JSON.parse(message);

      switch (event.type) {
        case "getRouterRtpCapabilities":
          onRouterRtpCapabilities(event, ws);
          break;
        case "createProducerTransport":
          onCreateProducerTransport(event, ws);
          break;
        case "connectProducerTransport":
          onConnectProducerTransport(event, ws);
          break;
        case "produce":
          onProduce(event, ws, websock);
          break;
        case "createConsumerTransport":
          onCreateConsumerTransport(event, ws);
          break;
        case "connectConsumerTransport":
          onConnectConsumerTransport(event, ws);
          break;
        case "consume":
          onConsume(event, ws);
          break;
        case "resume":
          onResume(event, ws);
          break;
        default:
          break;
      }
    });
  });

  const onConnectProducerTransport = async (e: any, ws: WebSocket) => {
    log.info("Connecting producer transport...");

    await produceTransport.connect({ dtlsParameters: e.dtlsParameters });

    send(ws, "producerTransportConnected", {
      success: true,
      msg: "Producer transport connected successfully.",
    });
  };

  const onCreateProducerTransport = async (e: string, ws: WebSocket) => {
    log.info("Creating producer transport...");

    try {
      const { transport, params } =
        await createWebrtcTransport(mediasoupRouter);
      produceTransport = transport;
      send(ws, "producerTransportCreated", params);
      log.info("Producer transport created and parameters sent to client.");
    } catch (error) {
      log.error({ error }, "Failed to create producer transport");
      send(ws, "producerTransportCreationFailed", { error });
    }
  };

  const onRouterRtpCapabilities = async (e: string, ws: WebSocket) => {
    send(ws, "routerRtpCapabilities", mediasoupRouter.rtpCapabilities);
  };

  const onProduce = async (
    e: any,
    ws: WebSocket,
    websock: WebSocket.Server,
  ) => {
    const { kind, rtpParameters } = e;
    log.info(`Producing media of kind: ${kind}`);

    producer = await produceTransport.produce({ kind, rtpParameters });

    const resp = {
      id: producer.id,
    };

    send(ws, "produced", resp);
    broadcast(websock, "newProducer", "New user");
  };

  const onCreateConsumerTransport = async (e: string, ws: WebSocket) => {
    log.info("Creating consumer transport...");
    try {
      const { transport, params } =
        await createWebrtcTransport(mediasoupRouter);
      consumerTransport = transport;
      send(ws, "consumerTransportCreated", params);
    } catch (error) {
      log.error({ error }, "Failed to create consumer transport");
    }
  };

  const onConnectConsumerTransport = async (e: any, ws: WebSocket) => {
    await consumerTransport.connect({ dtlsParameters: e.dtlsParameters });
    send(ws, "consumerConnected", {});
  };

  const onConsume = async (event: any, ws: WebSocket) => {
    const res = await createConsumer(producer, event.rtpCapabilities);
    send(ws, "subscribed", res);
  };

  const onResume = async (event: any, ws: WebSocket) => {
    await consumer.resume();
    send(ws, "resumed", "resumed");
  };

  const IsJsonString = (str: string) => {
    try {
      JSON.parse(str);
    } catch (error) {
      return false;
    }
    return true;
  };

  const send = (ws: WebSocket, type: string, msg: any) => {
    const message = {
      type,
      data: msg,
    };

    const resp = JSON.stringify(message);
    ws.send(resp);
  };

  const broadcast = (ws: WebSocket.Server, type: string, msg: any) => {
    const message = {
      type,
      data: msg,
    };
    const resp = JSON.stringify(message);
    websock.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // remove check if not needed;
        client.send(resp);
      }
    });
  };

  const createConsumer = async (
    producer: Producer,
    rtpCapabilites: RtpCapabilities,
  ) => {
    if (
      !mediasoupRouter.canConsume({
        producerId: producer.id,
        rtpCapabilities: rtpCapabilites,
      })
    ) {
      log.error("can not consume");
      return;
    }

    try {
      consumer = await consumerTransport.consume({
        producerId: producer.id,
        rtpCapabilities: rtpCapabilites,
        paused: producer.kind === "video",
      });
    } catch (error) {
      log.error({ error }, "failed to create consumer transport");
    }

    return {
      producerId: producer.id,
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      producerPaused: consumer.producerPaused,
    };
  };
};

export { WebsocketConnection };
