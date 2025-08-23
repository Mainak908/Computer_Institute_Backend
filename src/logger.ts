import { pino } from "pino";
import pretty from "pino-pretty";
import dayjs from "dayjs";

const isProduction = process.env.NODE_ENV === "production";

const customTimestamp = () =>
  `,"time":"${dayjs().format("DD-MM-YYYY HH:mm:ss")}"`;

const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    formatters: {
      level: (label) => ({ severity: label.toUpperCase() }),
    },
    timestamp: customTimestamp,
  },
  isProduction
    ? process.stdout // Raw JSON logs to stdout in production
    : pretty({
        // Pretty logs for development
        translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
        ignore: "pid,hostname",
        colorize: true,
      })
);

export default logger;
