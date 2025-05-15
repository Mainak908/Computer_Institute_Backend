import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import router from "./router/mainRouter.js";
import rateLimit from "express-rate-limit";
import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Redis } from "ioredis";
import { prisma } from "./client.js";
import helmet from "helmet";
import logger from "./logger.js";
import { Resend } from "resend";
import { pinoHttp } from "pino-http";
import os from "os";

const loggerHttp = pinoHttp({
  customLogLevel: function (res, err) {
    if (res.statusCode && res.statusCode >= 400 && res.statusCode < 500)
      return "warn";
    if (res.statusCode && res.statusCode >= 500) return "error";
    return "info";
  },
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        origin: req.headers.origin,
        hostname: os.hostname(),
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
        responseTime: res.responseTime,
        date: new Date().toUTCString(),
      };
    },
  },
});

export const resend = new Resend(process.env.RESEND_KEY);

dotenv.config();

export const redisClient = new Redis(process.env.REDIS_UPSTASH!);

redisClient.on("connect", () => logger.info("Connected to Redis"));
redisClient.on("error", (err) => logger.error("Redis Error:", err));

const app = express();
const PORT = 3001;
app.set("trust proxy", 1);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 100 requests
  message: "Too many requests, please try again later.",
});

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const allowedOrigins = [
  process.env.CORSORIGIN,
  process.env.CORSORIGIN2,
  process.env.CORSORIGIN3,
];

app.use(helmet());
app.use(generalLimiter);
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ limit: "20kb", extended: true }));

app.use(cookieParser(process.env.COOKIEP));
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    maxAge: 11600,
  })
);

app.use(loggerHttp);

app.get("/generate-presigned-url", async (req, res) => {
  try {
    const { fileName, category } = req.query;

    const fileType = req.query.fileType as string;
    const keypart = fileType.split("/")[0];

    if (!fileName || !fileType || !category) {
      res.status(400).json({ error: "Missing required query parameters" });
      return;
    }

    const Key = `${keypart}s/${category}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: Key,
      ContentType: fileType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 });

    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

app.post("/fetch_aws_res", async (req, res) => {
  try {
    const { Prefix } = req.body;

    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix,
    });

    const data = await s3.send(command);

    const imageUrls =
      data.Contents?.map((item) => {
        if (!item.Key) return null;
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`;
      }).filter(Boolean) || [];

    res.json({ data: imageUrls });
  } catch (error) {
    logger.error(error);
  }
});
app.post("/fetch_master", async (req, res) => {
  const { Prefix } = req.body;
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix,
    Delimiter: "/",
  });

  const { CommonPrefixes } = await s3.send(command);
  const data = CommonPrefixes?.map((obj) => obj.Prefix?.split("hls/")[1]);
  res.json(data);
});

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use(router);

app.use((_, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: any, _: Request, res: Response) => {
  res.status(500).json({ error: "Internal Server Error" });
});

process.on("SIGINT", async () => {
  logger.error("Shutting down gracefully...");
  await redisClient.quit();
  await prisma.$disconnect();
  process.exit(0);
});

// ✅ Start Server
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
