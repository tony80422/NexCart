import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Open", "Investigating", "Resolved"],
      default: "Open",
    },
  },
  {
    timestamps: true,
  }
);

export const Alert = mongoose.model("Alert", alertSchema);