import { dbConnection } from "../../database/dbconnection.js";
import { AppError } from "../../utils/catch-error.js";
import { globalError } from "../../utils/global-error.js";
import * as allRouters from "./index.js";
export const bootstrap = (app) => {
  process.on("uncaughtException", (err) => {
    console.log("ERROR in code: ", err);
  });

  dbConnection();

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
