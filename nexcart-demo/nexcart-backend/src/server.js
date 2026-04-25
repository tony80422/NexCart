import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { appConfig } from "./config/appConfig.js";
import { loggingService } from "./services/loggingService.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import merchantRoutes from "./routes/merchantRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import awsRoutes from "./routes/awsRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "nexcart-backend",
    env: appConfig.env,
    aws: {
      useS3: appConfig.aws.useS3,
      useSns: appConfig.aws.useSns,
      useCloudWatch: appConfig.aws.useCloudWatch,
      useCognito: appConfig.aws.useCognito
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/aws", awsRoutes);

connectDB().then(() => {
  app.listen(appConfig.port, () => {
    loggingService.info(
      `NexCart backend running on http://localhost:${appConfig.port}`
    );
  });
});