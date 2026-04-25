import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { Alert } from "../models/Alert.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { loggingService } from "../services/loggingService.js";

const router = express.Router();

/**
 * GET /api/admin/alerts
 */
router.get("/alerts", authMiddleware, requireRole("admin"), async (_req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });

    return res.json({
      items: alerts.map((alert) => ({
        id: alert._id,
        level: alert.level,
        title: alert.title,
        message: alert.message,
        status: alert.status,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
      })),
    });
  } catch (error) {
    loggingService.error("Load alerts failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /api/admin/alerts/:id/resolve
 */
router.patch("/alerts/:id/resolve", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    alert.status = "Resolved";
    await alert.save();

    loggingService.info("Admin resolved alert", {
      adminId: String(req.user._id),
      alertId: String(alert._id),
    });

    return res.json({
      message: "Alert resolved",
      item: {
        id: alert._id,
        level: alert.level,
        title: alert.title,
        message: alert.message,
        status: alert.status,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
      },
    });
  } catch (error) {
    loggingService.error("Resolve alert failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/admin/dashboard
 */
router.get("/dashboard", authMiddleware, requireRole("admin"), async (_req, res) => {
  try {
    const [userCount, productCount, orderCount, openAlertCount, orders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Alert.countDocuments({ status: { $ne: "Resolved" } }),
      Order.find({}, { total: 1 }),
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    return res.json({
      totalUsers: userCount,
      totalProducts: productCount,
      totalOrders: orderCount,
      openAlerts: openAlertCount,
      totalRevenue: Number(totalRevenue.toFixed(2)),
    });
  } catch (error) {
    loggingService.error("Load admin dashboard failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/admin/users
 */
router.get("/users", authMiddleware, requireRole("admin"), async (_req, res) => {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });

    return res.json({
      items: users.map((user) => ({
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        failedLoginCount: user.failedLoginCount,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    loggingService.error("Load admin users failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/admin/orders
 */
router.get("/orders", authMiddleware, requireRole("admin"), async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    return res.json({
      items: orders.map((order) => ({
        id: order._id,
        userId: order.userId,
        items: order.items,
        subtotal: order.subtotal,
        platformFee: order.platformFee,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    });
  } catch (error) {
    loggingService.error("Load admin orders failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/admin/products
 */
router.get("/products", authMiddleware, requireRole("admin"), async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    return res.json({
      items: products,
    });
  } catch (error) {
    loggingService.error("Load admin products failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;