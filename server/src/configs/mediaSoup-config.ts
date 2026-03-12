import { RtpCodecCapability, TransportListenInfo, TransportListenIp, WorkerLogTag } from "mediasoup/node/lib/types";
import os from "os";

export const config = {
  listenIp: "0.0.0.0",
  listenPort: 3016,

  mediasoup: {
    numWorkers: Object.keys(os.cpus()).length,
    worker: {
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
      logLevel: "debug",
      logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"] as WorkerLogTag[],
    },
    router: {
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/opus",
          clockRate: 90000,
          channels: 1,
          parameters: {
            "x-google-start-bitrate": 1000,
          },
        },
      ] as RtpCodecCapability[],
    },

    // webRtcTranspor settings

    webRtcTransport: {
      listenIps: [
        {
          ip: "0.0.0.0",
          announcedIp: "127.0.0.1", // replace with public IP
        },
      ] as TransportListenInfo[],
    },
  },
} as const;
