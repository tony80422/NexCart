import { appConfig } from "../config/appConfig.js";

function logToConsole(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, meta);
}

export const loggingService = {
  info(message, meta = {}) {
    if (appConfig.aws.useCloudWatch) {
      // Future: send logs to AWS CloudWatch
      logToConsole("info", `[CloudWatch-ready] ${message}`, meta);
      return;
    }

    logToConsole("info", message, meta);
  },

  warn(message, meta = {}) {
    if (appConfig.aws.useCloudWatch) {
      logToConsole("warn", `[CloudWatch-ready] ${message}`, meta);
      return;
    }

    logToConsole("warn", message, meta);
  },

  error(message, meta = {}) {
    if (appConfig.aws.useCloudWatch) {
      logToConsole("error", `[CloudWatch-ready] ${message}`, meta);
      return;
    }

    logToConsole("error", message, meta);
  }
};