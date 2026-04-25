import { appConfig } from "../config/appConfig.js";
import { loggingService } from "./loggingService.js";

export const notificationService = {
  async sendAlert({ subject, message, meta = {} }) {
    if (appConfig.aws.useSns) {
      loggingService.info("SNS-ready alert triggered", {
        subject,
        message,
        meta,
        topicArn: appConfig.aws.snsTopicArn
      });

      return {
        provider: "sns",
        success: true
      };
    }

    loggingService.info("Local alert notification", {
      subject,
      message,
      meta
    });

    return {
      provider: "local",
      success: true
    };
  }
};