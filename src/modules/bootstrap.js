import { dbConnection } from "../../database/dbconnection.js";
import dotenv from "dotenv";
dotenv.config();

import { AppError } from "../../utils/catch-error.js";
import { globalError } from "../../utils/global-error.js";
import * as allRouters from "./index.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../../swagger.js";

export const bootstrap = (app) => {
  process.on("uncaughtException", (err) => {
    console.log("ERROR in code: ", err);
  });

  if (process.env.NODE_ENV !== "test") {
    dbConnection();
  }

  //==> Serve Swagger API Docs
  app.use("/taskflow-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
