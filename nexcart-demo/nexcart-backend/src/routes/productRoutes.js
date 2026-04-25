import express from "express";
import { Product } from "../models/Product.js";
import { authMiddleware } from "../middleware/auth.js";
import { loggingService } from "../services/loggingService.js";

const router = express.Router();

/**
 * GET /api/products
 * customer: only active products
 * merchant: all products
 * admin: forbidden (same behavior as your old single-file backend)
 */

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

router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role === "customer") {
      const items = await Product.find({ status: "Active" }).sort({ createdAt: -1 });
      return res.json({ items : items.map(formatProduct) });
    }

    if (req.user.role === "merchant") {
      const items = await Product.find().sort({ createdAt: -1 });
      return res.json({ items : items.map(formatProduct) });
    }

    loggingService.warn("Admin tried to access storefront products", {
      userId: String(req.user._id),
      role: req.user.role,
    });

    return res
      .status(403)
      .json({ message: "Admins do not access storefront products from this endpoint" });
  } catch (error) {
    loggingService.error("Load products failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;