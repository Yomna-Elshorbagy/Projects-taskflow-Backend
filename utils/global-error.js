import { logger } from "./logger.js";

export const globalError = async (err, req, res, next) => {
  let code = err.statusCode || 500;

  // Log the error centrally with full stack trace via Winston
  logger.error(err);

  res.status(code).json({
    error: "Error: ",
    message: err.message,
    code,
    success: false,
  });
};
