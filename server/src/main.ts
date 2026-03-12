import express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import { WebsocketConnection } from "./lib/ws";

const main = async () => {
  const app = express();
  const server = http.createServer(app);
  const websocket = new WebSocket.Server({ server, path: "/ws" });

  WebsocketConnection(websocket);
  

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

export { main };
