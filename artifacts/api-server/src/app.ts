import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const defaultLocalOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // Expo (Metro / web): mismo host que el bundler
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:8082",
  "http://127.0.0.1:8082",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
];
const fromEnv =
  process.env.ADMIN_ORIGIN?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];
const isProduction = process.env.NODE_ENV === "production";
const corsAllowList = isProduction
  ? fromEnv
  : [...new Set([...defaultLocalOrigins, ...fromEnv])];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsAllowList.length === 0) {
        callback(null, true);
        return;
      }
      if (corsAllowList.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
