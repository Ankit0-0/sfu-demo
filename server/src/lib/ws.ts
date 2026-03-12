import WebSocket from "ws";
import { createWorker } from "./worker";

let mediasoupRouter;
const WebsocketConnection = async (websock: WebSocket.Server) => {
  try {
    mediasoupRouter = await createWorker();
  } catch (error) {
    throw error;
  }
  websock.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection established.");

    ws.on("message", (message: string) => {
      console.log(`Received message: ${message}`);
      ws.send(`Echo: ${message}`);
    });
  });
};

export { WebsocketConnection };
