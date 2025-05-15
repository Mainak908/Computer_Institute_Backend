import { pino } from "pino";
import pretty from "pino-pretty";
import dayjs from "dayjs";

// ✅ Pretty Console Log Output (for readability during dev)
const prettyStream = pretty({
  translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
  ignore: "pid,hostname",
  colorize: true,
});
const isProduction = process.env.NODE_ENV === "production";

const streams = isProduction
  ? [{ stream: process.stdout }] // ✅ Raw JSON logs to stdout
  : [
      { stream: prettyStream }, // 🧪 Dev console logs (pretty)
    ];
const customTimestamp = () =>
  `,"time":"${dayjs().format("DD-MM-YYYY HH:mm:ss")}"`;

// ✅ Create Logger with Multiple Streams
const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info", // Default level from .env
    formatters: {
      level: (label) => ({ severity: label.toUpperCase() }), // Format level labels
    },
    timestamp: customTimestamp,
  },
  pino.multistream(streams) // Combine multiple output streams
);

export default logger;
