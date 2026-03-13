import WebSocket from "ws";
import { createWorker } from "./worker";
import { createLogger } from "./logger/logger";

const log = createLogger({ module: 'ws' });

let mediasoupRouter;
const WebsocketConnection = async (websock: WebSocket.Server) => {
  try {
    mediasoupRouter = await createWorker();
        log.info('Mediasoup router ready for WS layer');
  } catch (error) {
    log.error({ error }, 'Failed to initialize Mediasoup');
    throw error;
  }
  websock.on("connection", (ws: WebSocket) => {
    log.info("New WebSocket connection established.");

    ws.on("message", (message: string) => {
      log.info(`Received message: ${message}`);
      ws.send(`Echo: ${message}`);
    });
  });
};

export { WebsocketConnection };
