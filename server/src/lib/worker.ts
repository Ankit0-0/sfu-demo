import * as mediasoup from "mediasoup";
import { config } from "../configs/mediaSoup-config";
import { Worker, Router } from "mediasoup/node/lib/types";
import { createLogger } from "./logger";

const log = createLogger({ module: "mediasoup" });

const worker: Array<{
  worker: Worker;
  router: Router;
}> = [];

let nextMediasoupWorkerIdx = 0;

const createWorker = async () => {
  const worker = await mediasoup.createWorker({
    logLevel: config.mediasoup.worker.logLevel,
    logTags: config.mediasoup.worker.logTags,
    rtcMinPort: config.mediasoup.worker.rtcMinPort,
    rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
  });

  worker.on("died", () => {
    log.error(
      { pid: worker.pid },
      "Mediasoup worker died, exiting in 2 seconds",
    );
    setTimeout(() => process.exit(1), 2000);
  });

  log.info({ pid: worker.pid }, "Mediasoup worker created");
};

export { createWorker };
