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

const productSeeds = [
  {
    name: "NexBuds Pro",
    price: 59.99,
    stock: 26,
    status: "Active",
    category: "Audio",
    description: "Wireless earbuds with noise reduction and long battery life.",
    imageUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "NexKey Mechanical Keyboard",
    price: 89.0,
    stock: 14,
    status: "Active",
    category: "Accessories",
    description: "Compact mechanical keyboard designed for work and gaming.",
    imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "NexHub USB-C Dock",
    price: 35.5,
    stock: 31,
    status: "Inactive",
    category: "Connectivity",
    description: "Multi-port USB-C dock for laptops, tablets, and mobile devices.",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "NexView 4K Monitor",
    price: 279.0,
    stock: 8,
    status: "Active",
    category: "Display",
    description: "27-inch 4K monitor with vivid color and slim bezel design.",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "NexCharge Power Bank",
    price: 42.0,
    stock: 20,
    status: "Active",
    category: "Power",
    description: "Fast-charging portable battery pack for travel and daily use.",
    imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "NexCam Mini",
    price: 64.0,
    stock: 11,
    status: "Inactive",
    category: "Smart Devices",
    description: "Compact smart camera for home monitoring and live viewing.",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "NexPad Wireless Charger",
    price: 24.99,
    stock: 35,
    status: "Active",
    category: "Power",
    description: "Minimal wireless charging pad for phones and earbuds.",
    imageUrl: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "NexSpeaker Air",
    price: 74.5,
    stock: 18,
    status: "Active",
    category: "Audio",
    description: "Portable Bluetooth speaker with clear sound and compact design.",
    imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=900&q=80",
  },
];

async function seedProducts() {
  try {
    await connectDB();

    console.log("Seeding products...");

    const merchant = await User.findOne({ username: "merchant", role: "merchant" });

    if (!merchant) {
      console.error('Merchant user not found. Please run "seedUsers.js" first.');
      process.exit(1);
    }

    for (const productData of productSeeds) {
      const exists = await Product.findOne({ name: productData.name });

      if (exists) {
        exists.price = productData.price;
        exists.stock = productData.stock;
        exists.status = productData.status;
        exists.category = productData.category;
        exists.description = productData.description;
        exists.imageUrl = productData.imageUrl;
        exists.merchantId = merchant._id;

        await exists.save();
        
        console.log(`Product already exists: ${productData.name}`);
        continue;
      }

      const newProduct = await Product.create({
        ...productData,
        merchantId: merchant._id,
      });

      console.log(`Created product: ${newProduct.name}`);
    }

    console.log("Product seeding completed ✅");
    process.exit(0);
  } catch (error) {
    console.error("Product seeding failed ❌", error);
    process.exit(1);
  }
}

seedProducts();