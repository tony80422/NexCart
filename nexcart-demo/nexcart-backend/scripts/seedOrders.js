import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

import { connectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Product } from "../src/models/Product.js";
import { Order } from "../src/models/Order.js";

// 随机工具
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 随机时间（过去30天内任意时间）
function randomDateWithinDays(days = 30) {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

// 订单状态
const orderStatuses = ["Confirmed", "Paid", "Shipped", "Delivered", "Cancelled"];

// 地址池
const addresses = [
  "123 Main St, Boston, MA",
  "456 Park Ave, New York, NY",
  "789 Sunset Blvd, Los Angeles, CA",
  "321 Lake Shore Dr, Chicago, IL",
];

// 支付方式
const paymentMethods = ["card", "paypal", "apple_pay"];

// 每次生成订单数量
const ORDER_COUNT = 20;

async function seedOrders() {
  try {
    await connectDB();

    console.log("Seeding orders...");

    const customers = await User.find({ role: "customer" });
    const products = await Product.find({ status: "Active" });

    if (customers.length === 0) {
      console.error("No customers found. Run seedUsers.js first.");
      process.exit(1);
    }

    if (products.length === 0) {
      console.error("No products found. Run seedProducts.js first.");
      process.exit(1);
    }

    for (let i = 0; i < ORDER_COUNT; i++) {
      const customer = randomFromArray(customers);

      const itemCount = randomInt(1, 3);

      const selectedProducts = [];
      for (let j = 0; j < itemCount; j++) {
        selectedProducts.push(randomFromArray(products));
      }

      const orderItems = selectedProducts.map((product) => {
        const quantity = randomInt(1, 2);

        return {
          productId: product._id,
          productName: product.name,
          merchantId: product.merchantId || null,
          price: product.price,
          quantity,
        };
      });

      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const platformFee = 2.99;
      const total = Number((subtotal + platformFee).toFixed(2));

      const randomCreatedAt = randomDateWithinDays(30);

      const order = await Order.create({
        userId: customer._id,
        items: orderItems,
        subtotal: Number(subtotal.toFixed(2)),
        platformFee,
        total,
        status: randomFromArray(orderStatuses),
        billingAddress: randomFromArray(addresses),
        paymentMethod: randomFromArray(paymentMethods),
        createdAt: randomCreatedAt,
        updatedAt: randomCreatedAt,
      });

      console.log(`Created order: ${order._id}`);
    }

    console.log("Order seeding completed ✅");
    process.exit(0);
  } catch (error) {
    console.error("Order seeding failed ❌", error);
    process.exit(1);
  }
}

seedOrders();