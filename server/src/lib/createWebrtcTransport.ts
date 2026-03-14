import { Router } from "mediasoup/node/lib/types";
import { config } from "../configs/mediaSoup-config";
import { createLogger } from "./logger/logger";

const log = createLogger({ module: "webrtcTransport" });

const createWebrtcTransport = async (mediasoupRouter: Router) => {
  const { maxIncomingBitrate, initialAvailableOutgoingBitrate } =
    config.mediasoup.webRtcTransport;

  const transport = await mediasoupRouter.createWebRtcTransport({
    listenIps: config.mediasoup.webRtcTransport.listenIps,
    initialAvailableOutgoingBitrate,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  if (maxIncomingBitrate) {
    try {
      await transport.setMaxIncomingBitrate(maxIncomingBitrate);
    } catch (error) {
      log.error(
        { error },
        "Failed to set max incoming bitrate for WebRTC transport",
      );
    }
  }

  return {
    transport,
    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    },
  };
};

export { createWebrtcTransport };
