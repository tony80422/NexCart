import express from "express";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { authProvider } from "../services/authProvider.js";
import { loggingService } from "../services/loggingService.js";

const router = express.Router();

const roleLabels = {
  customer: "Consumer",
  merchant: "Merchant",
  admin: "Administrator",
};

function sanitizeUser(user) {
  return {
    id: user._id,
    username: user.username,
    role: user.role,
    roleLabel: roleLabels[user.role] || user.role,
    fullName: user.fullName,
    email: user.email,
    isActive: user.isActive,
    walletBalance: user.walletBalance || 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, username, password, role } = req.body;

    if (!fullName || !email || !username || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["customer", "merchant", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const exists = await User.findOne({
      username: String(username).trim(),
      role,
    });

    if (exists) {
      return res
        .status(409)
        .json({ message: "This username already exists for the selected role" });
    }

    const passwordHash = await authProvider.hashPassword(String(password));

    const newUser = await User.create({
      fullName: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      username: String(username).trim(),
      passwordHash,
      role,
    });

    loggingService.info("User registered", {
      userId: String(newUser._id),
      username: newUser.username,
      role: newUser.role,
    });

    return res.status(201).json({
      message: `Registration successful for ${roleLabels[role]}`,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    loggingService.error("Register failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ message: "Username, password, and role are required" });
    }

    const user = await User.findOne({
      username: String(username).trim(),
      role,
    });

    if (!user) {
      loggingService.warn("Login failed: user not found", {
        username,
        role,
      });
      return res
        .status(401)
        .json({ message: "Invalid username or password for the selected role" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled" });
    }

    const isMatch = await authProvider.comparePassword(
      String(password),
      user.passwordHash
    );

    if (!isMatch) {
      user.failedLoginCount += 1;
      await user.save();

      loggingService.warn("Login failed: password mismatch", {
        userId: String(user._id),
        username: user.username,
        role: user.role,
        failedLoginCount: user.failedLoginCount,
      });

      return res
        .status(401)
        .json({ message: "Invalid username or password for the selected role" });
    }

    user.failedLoginCount = 0;
    await user.save();

    const token = await authProvider.issueToken(user);

    loggingService.info("Login successful", {
      userId: String(user._id),
      username: user.username,
      role: user.role,
    });

    return res.json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    loggingService.error("Login failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /api/auth/logout
 * JWT stateless mode: frontend just deletes token.
 */
router.post("/logout", authMiddleware, async (req, res) => {
  loggingService.info("Logout", {
    userId: String(req.user._id),
    username: req.user.username,
    role: req.user.role,
  });

  return res.json({ message: "Logged out" });
});

/**
 * GET /api/auth/me
 */
router.get("/me", authMiddleware, async (req, res) => {
  return res.json({
    user: sanitizeUser(req.user),
  });
});

export default router;