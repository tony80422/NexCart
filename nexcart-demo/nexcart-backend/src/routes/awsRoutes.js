import express from "express";
import { appConfig } from "../config/appConfig.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { loggingService } from "../services/loggingService.js";
import { notificationService } from "../services/notificationService.js";
import { storageService } from "../services/storageService.js";

const router = express.Router();

/**
 * GET /api/aws/status
 * Reserved endpoint for checking AWS integration status.
 */
router.get("/status", (_req, res) => {
  return res.json({
    provider: "aws-ready",
    env: appConfig.env,
    region: appConfig.aws.region,
    services: {
      s3: appConfig.aws.useS3,
      sns: appConfig.aws.useSns,
      cloudWatch: appConfig.aws.useCloudWatch,
      cognito: appConfig.aws.useCognito
    }
  });
});

/**
 * POST /api/aws/storage/upload-url
 * Reserved S3 upload endpoint.
 * Current version only returns local or S3 placeholder path.
 */
router.post(
  "/storage/upload-url",
  authMiddleware,
  requireRole("merchant", "admin"),
  async (req, res) => {
    try {
      const { fileName, contentType } = req.body;

      if (!fileName) {
        return res.status(400).json({ message: "fileName is required" });
      }

      const result = await storageService.uploadFile({
        fileName: String(fileName),
        contentType: contentType || "application/octet-stream"
      });

      return res.json({
        message: "Storage upload endpoint is ready",
        ...result
      });
    } catch (error) {
      loggingService.error("Storage upload-url failed", {
        error: error.message
      });

      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/aws/notifications/test
 * Reserved SNS notification endpoint.
 */
router.post(
  "/notifications/test",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        subject = "NexCart AWS Notification Test",
        message = "AWS SNS placeholder test"
      } = req.body;

      const result = await notificationService.sendAlert({
        subject,
        message,
        meta: {
          requestedBy: String(req.user._id),
          role: req.user.role
        }
      });

      return res.json({
        message: "Notification endpoint is ready",
        ...result
      });
    } catch (error) {
      loggingService.error("Notification test failed", {
        error: error.message
      });

      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/aws/metrics/event
 * Reserved CloudWatch custom metric endpoint.
 */
router.post("/metrics/event", authMiddleware, async (req, res) => {
  try {
    const {
      name = "FrontendEvent",
      value = 1,
      unit = "Count",
      meta = {}
    } = req.body;

    loggingService.info("CloudWatch-ready metric event", {
      name,
      value,
      unit,
      meta,
      userId: String(req.user._id),
      role: req.user.role
    });

    return res.json({
      message: "Metric endpoint is ready",
      provider: appConfig.aws.useCloudWatch ? "cloudwatch" : "local",
      metric: {
        name,
        value,
        unit
      }
    });
  } catch (error) {
    loggingService.error("Metric event failed", {
      error: error.message
    });

    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;