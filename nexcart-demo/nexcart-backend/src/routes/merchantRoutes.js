import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { loggingService } from "../services/loggingService.js";

const router = express.Router();

function formatProduct(product) {
  return {
    id: product._id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    status: product.status,
    category: product.category,
    description: product.description,
    imageUrl: product.imageUrl,
    merchantId: product.merchantId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/**
 * GET /api/merchant/wallet
 */
router.get("/wallet", authMiddleware, requireRole("merchant"), async (req, res) => {
  try {
    const merchant = await User.findById(req.user._id);

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    return res.json({
      balance: Number(merchant.walletBalance || 0),
      payoutAccount: "**** 7712",
      settlementCycle: "Weekly",
    });
  } catch (error) {
    loggingService.error("Load merchant wallet failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /api/merchant/wallet/withdraw
 */
router.post("/wallet/withdraw", authMiddleware, requireRole("merchant"), async (req, res) => {
  try {
    const amount = Number(req.body.amount ?? 200);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const merchant = await User.findById(req.user._id);

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    const currentBalance = Number(merchant.walletBalance || 0);

    if (currentBalance <= 0) {
      return res.status(400).json({ message: "No available balance" });
    }

    const nextBalance = Math.max(0, currentBalance - amount);
    const actualWithdrawn = Number((currentBalance - nextBalance).toFixed(2));

    merchant.walletBalance = Number(nextBalance.toFixed(2));
    await merchant.save();

    loggingService.info("Merchant withdrew funds", {
      merchantId: String(merchant._id),
      requestedAmount: amount,
      actualWithdrawn,
      balance: merchant.walletBalance,
    });

    return res.json({
      message: `Withdrawal successful: $${actualWithdrawn.toFixed(2)}`,
      withdrawn: actualWithdrawn,
      balance: merchant.walletBalance,
    });
  } catch (error) {
    loggingService.error("Withdraw failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /api/merchant/wallet/receive
 */
router.post("/wallet/receive", authMiddleware, requireRole("merchant"), async (req, res) => {
  try {
    const amount = Number(req.body.amount ?? 500);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const merchant = await User.findById(req.user._id);

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    const currentBalance = Number(merchant.walletBalance || 0);
    merchant.walletBalance = Number((currentBalance + amount).toFixed(2));
    await merchant.save();

    loggingService.info("Merchant received payment", {
      merchantId: String(merchant._id),
      amount,
      balance: merchant.walletBalance,
    });

    return res.json({
      message: "Payment received successfully",
      amount,
      balance: merchant.walletBalance,
    });
  } catch (error) {
    loggingService.error("Receive payment failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /api/merchant/products/:id/toggle
 */
router.patch("/products/:id/toggle", authMiddleware, requireRole("merchant"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.status = product.status === "Active" ? "Inactive" : "Active";
    await product.save();

    loggingService.info("Merchant toggled product status", {
      merchantId: String(req.user._id),
      productId: String(product._id),
      status: product.status,
    });

    return res.json({
      message: "Product status updated",
      item: formatProduct(product),
    });
  } catch (error) {
    loggingService.error("Toggle product failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/merchant/orders
 */
router.get("/orders", authMiddleware, requireRole("merchant"), async (req, res) => {
  try {
    const orders = await Order.find({
      "items.merchantId": req.user._id,
    }).sort({ createdAt: -1 });

    const filtered = orders.map((order) => {
      const merchantItems = order.items.filter(
        (item) => String(item.merchantId) === String(req.user._id)
      );

      const subtotal = merchantItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return {
        id: order._id,
        customerId: order.userId,
        items: merchantItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
        })),
        merchantSubtotal: Number(subtotal.toFixed(2)),
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    return res.json({ items: filtered });
  } catch (error) {
    loggingService.error("Load merchant orders failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /api/merchant/orders/:id/status
 */
router.patch("/orders/:id/status", authMiddleware, requireRole("merchant"), async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["Confirmed", "Paid", "Shipped", "Delivered", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const belongsToMerchant = order.items.some(
      (item) => String(item.merchantId) === String(req.user._id)
    );

    if (!belongsToMerchant) {
      return res.status(403).json({ message: "Forbidden: order access denied" });
    }

    order.status = status;
    await order.save();

    loggingService.info("Merchant updated order status", {
      merchantId: String(req.user._id),
      orderId: String(order._id),
      status,
    });

    return res.json({
      message: "Order status updated",
      item: {
        id: order._id,
        status: order.status,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    loggingService.error("Update merchant order status failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;