import WebSocket from "ws";
import { createWorker } from "./worker";
import { createLogger } from "./logger/logger";
import { Router } from "mediasoup/node/lib/types";

const log = createLogger({ module: "ws" });

let mediasoupRouter: Router;
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
        default:
          break;
      }
    });
  });

  const onRouterRtpCapabilities = async (e: string, ws: WebSocket) => {
    send(ws, "routerRtpCapabilities", mediasoupRouter.rtpCapabilities);
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
};

export { WebsocketConnection };
