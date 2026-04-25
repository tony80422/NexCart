import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Cart } from "../models/Cart.js";
import { loggingService } from "../services/loggingService.js";

const router = express.Router();

/**
 * POST /api/customer/orders
 * Create order from provided items
 */
router.post("/orders", authMiddleware, requireRole("customer"), async (req, res) => {
  try {
    const { items, billingAddress, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const normalizedItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity ?? 1);

      if (!item.id || !Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ message: "Invalid order item" });
      }

      const product = await Product.findById(item.id);

      if (!product || product.status !== "Active") {
        return res.status(400).json({ message: "One or more products are unavailable" });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }

      normalizedItems.push({
        product,
        quantity,
      });
    }

    const orderItems = normalizedItems.map(({ product, quantity }) => ({
      productId: product._id,
      productName: product.name,
      merchantId: product.merchantId || null,
      price: product.price,
      quantity,
    }));

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const platformFee = 2.99;
    const total = Number((subtotal + platformFee).toFixed(2));

    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      platformFee,
      total,
      status: "Confirmed",
      billingAddress: billingAddress || "",
      paymentMethod: paymentMethod || "card",
    });

    for (const { product, quantity } of normalizedItems) {
      product.stock -= quantity;
      await product.save();
    }

    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { items: [] } },
      { new: true }
    );

    loggingService.info("Order created", {
      orderId: String(order._id),
      userId: String(req.user._id),
      total: order.total,
    });

    return res.status(201).json({
      message: "Order placed successfully",
      order: {
        id: order._id,
        userId: order.userId,
        items: order.items.map((item) => ({
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: order.subtotal,
        platformFee: order.platformFee,
        total: order.total,
        status: order.status,
        billingAddress: order.billingAddress,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    loggingService.error("Create order failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/customer/orders
 * Current customer's orders
 */
router.get("/orders", authMiddleware, requireRole("customer"), async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.json({
      items: orders.map((order) => ({
        id: order._id,
        userId: order.userId,
        items: order.items.map((item) => ({
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: order.subtotal,
        platformFee: order.platformFee,
        total: order.total,
        status: order.status,
        billingAddress: order.billingAddress,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    });
  } catch (error) {
    loggingService.error("Load customer orders failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/customer/cart
 */
router.get("/cart", authMiddleware, requireRole("customer"), async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId");

    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: [],
      });
    }

    return res.json({
      items: cart.items.map((item) => ({
        id: item.productId?._id,
        name: item.productId?.name,
        price: item.productId?.price,
        status: item.productId?.status,
        stock: item.productId?.stock,
        category: item.productId?.category,
        imageUrl: item.productId?.imageUrl,
        quantity: item.quantity,
      })),
    });
  } catch (error) {
    loggingService.error("Load cart failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /api/customer/cart/items
 */
router.post("/cart/items", authMiddleware, requireRole("customer"), async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const addQty = Number(quantity ?? 1);

    if (!productId || !Number.isFinite(addQty) || addQty <= 0) {
      return res.status(400).json({ message: "Invalid cart item" });
    }

    const product = await Product.findById(productId);

    if (!product || product.status !== "Active") {
      return res.status(400).json({ message: "Product is unavailable" });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => String(item.productId) === String(productId)
    );

    const nextQty = existingItem ? existingItem.quantity + addQty : addQty;

    if (nextQty > product.stock) {
      return res.status(400).json({ message: "Quantity exceeds stock" });
    }

    if (existingItem) {
      existingItem.quantity = nextQty;
    } else {
      cart.items.push({
        productId,
        quantity: addQty,
      });
    }

    await cart.save();
    await cart.populate("items.productId");

    return res.status(201).json({
      message: "Item added to cart",
      items: cart.items.map((item) => ({
        id: item.productId?._id,
        name: item.productId?.name,
        price: item.productId?.price,
        status: item.productId?.status,
        stock: item.productId?.stock,
        category: item.productId?.category,
        imageUrl: item.productId?.imageUrl, 
        quantity: item.quantity,
      })),
    });
  } catch (error) {
    loggingService.error("Add cart item failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /api/customer/cart/items/:productId
 */
router.patch("/cart/items/:productId", authMiddleware, requireRole("customer"), async (req, res) => {
  try {
    const { quantity } = req.body;
    const nextQty = Number(quantity);

    if (!Number.isFinite(nextQty) || nextQty < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (nextQty > product.stock) {
      return res.status(400).json({ message: "Quantity exceeds stock" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      (entry) => String(entry.productId) === String(req.params.productId)
    );

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    item.quantity = nextQty;
    await cart.save();
    await cart.populate("items.productId");

    return res.json({
      message: "Cart item updated",
      items: cart.items.map((entry) => ({
        id: entry.productId?._id,
        name: entry.productId?.name,
        price: entry.productId?.price,
        status: entry.productId?.status,
        stock: entry.productId?.stock,
        category: entry.productId?.category,
        imageUrl: entry.productId?.imageUrl,
        quantity: entry.quantity,
      })),
    });
  } catch (error) {
    loggingService.error("Update cart item failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * DELETE /api/customer/cart/items/:productId
 */
router.delete("/cart/items/:productId", authMiddleware, requireRole("customer"), async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => String(item.productId) !== String(req.params.productId)
    );

    await cart.save();
    await cart.populate("items.productId");

    return res.json({
      message: "Cart item removed",
      items: cart.items.map((entry) => ({
        id: entry.productId?._id,
        name: entry.productId?.name,
        price: entry.productId?.price,
        status: entry.productId?.status,
        stock: entry.productId?.stock,
        category: entry.productId?.category,
        imageUrl: entry.productId?.imageUrl,  
        quantity: entry.quantity,
      })),
    });
  } catch (error) {
    loggingService.error("Delete cart item failed", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;