// not needed. 



// import pinoHttp from "pino-http";
// import logger from "./logger";
// import { randomUUID } from "crypto";

// export const httpLogger = pinoHttp({
//   logger,
//   // Add a correlation id for each request
//   genReqId: (req, res) => {
//     const existing = (req.headers["x-request-id"] ||
//       req.headers["x-correlation-id"]) as string | undefined;
//     const id = existing || randomUUID();
//     res.setHeader("x-request-id", id);
//     return id;
//   },
//   // Keep the logs minimal but useful
//   customSuccessMessage: function (req, res) {
//     return `${req.method} ${req.url} -> ${res.statusCode}`;
//   },
//   customErrorMessage: function (req, res, err) {
//     return `ERR ${req.method} ${req.url} -> ${res.statusCode}: ${err?.message}`;
//   },
//   // Attach req/res objects (respects redaction + serializers)
//   serializers: {
//     ...pinoHttp.stdSerializers,
//   },
// });
