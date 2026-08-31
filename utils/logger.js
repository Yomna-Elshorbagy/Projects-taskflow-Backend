import pino from "pino";

// Create the Pino Logger Instance
export const logger = pino({
  // Use 'debug' level in dev to see everything, 'info' in production to save logs/money
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  // Security: Automatically hide sensitive information from the logs
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'req.body.token', 'password', 'token'],
    censor: '[REDACTED]'
  },
  // Choose format based on environment
  transport: process.env.NODE_ENV === "development" 
    ? {
        // In local development, format raw JSON into beautiful, colored text
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname" // Hide annoying machine info in dev
        }
      }
    : undefined // In production (Vercel), leave as raw JSON for log aggregators
});
