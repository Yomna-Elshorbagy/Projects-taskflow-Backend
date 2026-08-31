import { dbConnection } from "../../database/dbconnection.js";
import dotenv from "dotenv";
dotenv.config();

import { AppError } from "../../utils/catch-error.js";
import { globalError } from "../../utils/global-error.js";
import * as allRouters from "./index.js";
import swaggerDocument from "../../swagger.js";
import redisService from "../services/redis.service.js";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import pinoHttp from "pino-http";
import { logger } from "../../utils/logger.js";
import { express5MongoSanitize } from "../middelwares/mongo-sanitize.js";


export const bootstrap = (app) => {
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception: ", err);
  });

  if (process.env.NODE_ENV !== "test") {
    dbConnection();
  }
  //////////////////////////////////////////////////////////////////////////////////

  // Security Middlewares
  app.use(helmet());
  app.use(express5MongoSanitize);

  // High-Performance HTTP Request Logging
  app.use(pinoHttp({ 
    logger,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    }
  }));

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redisService.client.sendCommand(args),
      prefix: 'rl:global:', // Unique prefix to prevent double-counting warnings
    }),
  });
  app.use(globalLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: "Too many authentication attempts from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    store: new RedisStore({
      sendCommand: (...args) => redisService.client.sendCommand(args),
      prefix: 'rl:auth:', // Unique prefix to prevent double-counting warnings
    }),
  });

  // Apply stricter rate limit to authentication endpoints
  app.use("/auth/login", authLimiter);
  app.use("/auth/signup", authLimiter);

  //////////////////////////////////////////////////////////////////////////////////

  const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.3.0/swagger-ui.min.css";
  const customJs = [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.3.0/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.3.0/swagger-ui-standalone-preset.js",
  ];

  app.use(
    "/taskflow-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customCssUrl: CSS_URL,
      customJs: customJs,
    })
  );
  //////////////////////////////////////////////////////////////////////////////////

  app.use("/auth", allRouters.authRouter);
  app.use("/projects", allRouters.projectRouter);

  app.use((req, res, next) => {
    next(new AppError(`Route Not Found ${req.originalUrl}`, 404));
  });

  app.use(globalError);

  process.on("unhandledRejection", (err) => {
    logger.error("Unhandled Rejection: ", err);
  });
};
