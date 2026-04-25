import { appConfig } from "../config/appConfig.js";
import { loggingService } from "./loggingService.js";

export const storageService = {
  async uploadFile({ fileName, contentType }) {
    if (appConfig.aws.useS3) {
      loggingService.info("S3-ready upload requested", {
        fileName,
        contentType,
        bucket: appConfig.aws.s3Bucket
      });

      return {
        provider: "s3",
        url: `https://${appConfig.aws.s3Bucket}.s3.${appConfig.aws.region}.amazonaws.com/${fileName}`
      };
    }

    loggingService.info("Local storage upload requested", {
      fileName,
      contentType
    });

    return {
      provider: "local",
      url: `/uploads/${fileName}`
    };
  }
};