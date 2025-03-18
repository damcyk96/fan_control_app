import pino from "pino";

// Create a logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

// Export helper functions for common log patterns
export const logRequestStart = (req: any) => {
  logger.info({
    msg: "Request started",
    method: req.method,
    url: req.url,
    id: req.id,
  });
};

export const logRequestComplete = (req: any, res: any, time: number) => {
  logger.info({
    msg: "Request completed",
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    id: req.id,
    duration: `${time.toFixed(2)}ms`,
  });
};
