import WebSocket from "ws";

const WebsocketConnection = async (websock: WebSocket.Server) => {
  websock.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection established.");

    ws.on("message", (message: string) => {
      console.log(`Received message: ${message}`);
      ws.send(`Echo: ${message}`);
    });

    });
};

export { WebsocketConnection };
