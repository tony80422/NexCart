import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "merchant", "admin"],
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginCount: {
      type: Number,
      default: 0,
    },
    captchaAnswer: {
      type: String,
      default: null,
    },
    captchaExpiresAt: {
      type: Date,
      default: null,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ username: 1, role: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);