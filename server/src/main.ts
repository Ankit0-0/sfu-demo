import express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import { WebsocketConnection } from "./lib/ws";

import logger from './lib/logger/logger'

const main = async () => {
  const app = express();
  const server = http.createServer(app);
  const websocket = new WebSocket.Server({ server, path: "/ws" });

  WebsocketConnection(websocket);
  

  const port = process.env.PORT || 8000;
  server.listen(port, () => {
    logger.info({ port }, 'HTTP server listening');
  })
  .on('error', (err) => {
    logger.error({err}, 'Http server failed to start');
    process.exit(1);
  })
};

export { main };
