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
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";


export const bootstrap = (app) => {
  process.on("uncaughtException", (err) => {
    console.log("ERROR in code: ", err);
  });

  if (process.env.NODE_ENV !== "test") {
    dbConnection();
  }
  //////////////////////////////////////////////////////////////////////////////////

  // Security Middlewares
  app.use(helmet());
  app.use(mongoSanitize());
  app.use(hpp());

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Use Redis as the store so limits are shared across all server instances
    store: new RedisStore({
      sendCommand: (...args) => redisService.client.sendCommand(args),
    }),
  });
  app.use(globalLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 authentication attempts per window
    message: "Too many authentication attempts from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // If they login successfully, don't penalize them
    store: new RedisStore({
      sendCommand: (...args) => redisService.client.sendCommand(args),
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
    console.log("ERROR: ", err);
  });
};
