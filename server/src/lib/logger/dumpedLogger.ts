import { error } from "console";
import pino, { LoggerOptions, Logger } from "pino";

const isProd = process.env.NODE_ENV === "production";

const baseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  base: {
    // info
    service: "sfu-demo-server",
    env: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.token",
      "*.accessToken",
      "*.refreshToken",
      "*.secret",
    ],
    censor: "[Redacted]",
  },

  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.err,
    res: pino.stdSerializers.res,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  messageKey: "message",
};

const transport = !isProd
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        singleLine: false,
        ignore: "pid,hostname",
      },
    }
  : undefined;

const logger: Logger = pino({ ...baseOptions, transport });

// child logger per module/file;
export const createLogger = (bindings: Record<string, any>) => {
  logger.child(bindings);
};

export default logger;
