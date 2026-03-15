> [!Note]
> This demo project is intended for explanation purposes only.  
> For the fully working version, see:  
> https://github.com/Ankit0-0/SFU-monorepo

## Mediasoup SFU Demo

A minimal **mediasoup SFU demo** showing the complete media flow between a browser and a mediasoup server.

The project uses:

- **WebSocket** for signaling
- **mediasoup** as the SFU
- **mediasoup-client** in the browser
- **WebRTC transports** for media

This is intentionally a **single-user demo**, so the server keeps **global state** for simplicity.

## Server State

The server maintains:

- one shared **Router**
- one **Producer Transport**
- one **Consumer Transport**
- one **Producer**
- one **Consumer**

In a real system these would be stored **per peer / per room**.

## Flow

1. Browser connects to the **WebSocket server**
2. Browser requests **router RTP capabilities**
3. Browser loads the **mediasoup Device**
4. Browser requests a **producer transport**
5. Browser connects the producer transport
6. Browser **produces video**
7. Browser requests a **consumer transport**
8. Browser connects the consumer transport
9. Browser asks to **consume the producer**
10. Server creates a **consumer**
11. Browser creates the local consumer
12. Consumer is **resumed and video plays**

Because this is a self-loop demo:

- **Local Video** → direct webcam preview  
- **Remote Video** → media returned through mediasoup


Mediasoup docs  
https://mediasoup.org/documentation/

Mediasoup API  
https://mediasoup.org/documentation/v3/mediasoup/api/

Mediasoup Client API  
https://mediasoup.org/documentation/v3/mediasoup-client/api/

Client ↔ Server Communication  
https://mediasoup.org/documentation/v3/communication-between-client-and-server/

WebRTC (MDN)  
https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
