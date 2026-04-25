import mongoose from "mongoose";
import { appConfig } from "./appConfig.js";

export async function connectDB() {
  try {
    if (!appConfig.mongodbUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(appConfig.mongodbUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}