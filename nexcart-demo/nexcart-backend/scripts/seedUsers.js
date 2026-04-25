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
import { authProvider } from "../src/services/authProvider.js";

const firstNames = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Lucas", "Sophia", "Mason"];
const lastNames = ["Carter", "Smith", "Brown", "Lee", "Wilson", "Taylor", "Wong", "Lin"];

function randomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function randomEmail(username) {
  const domains = ["gmail.com", "outlook.com", "yahoo.com"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${username}_${Math.floor(Math.random() * 1000)}@${domain}`;
}

const defaultUsers = [
  {
    username: "consumer",
    role: "customer",
    profile: {
      address: "12 Lakeview Ave, Boston, MA",
      phone: "+1 (617) 555-0148",
      membership: "Gold Member",
    },
  },
  {
    username: "merchant",
    role: "merchant",
    profile: {
      storeName: "NexCart Tech Store",
      payoutAccount: "**** 7712",
      settlementCycle: "Weekly",
      walletBalance: 3420.5,
    },
  },
  {
    username: "admin",
    role: "admin",
    profile: {
      adminTitle: "Platform Security Administrator",
      shift: "Day Shift",
      accessLevel: "Tier 1 Operations",
    },
  },
];

async function seedUsers() {
  try {
    await connectDB();

    console.log("Seeding users...");

    for (const userData of defaultUsers) {
      const exists = await User.findOne({
        username: userData.username,
        role: userData.role,
      });

      if (exists) {
        const updates = {
          fullName: exists.fullName || randomName(),
          email: exists.email || randomEmail(userData.username),
          ...userData.profile,
        };

        await User.updateOne(
          { _id: exists._id },
          { $set: updates }
        );

        console.log(`User already exists, profile updated: ${userData.username} (${userData.role})`);
        continue;
      }

      const passwordHash = await authProvider.hashPassword("123456");

      const newUser = await User.create({
        fullName: randomName(),
        email: randomEmail(userData.username),
        username: userData.username,
        passwordHash,
        role: userData.role,
        ...userData.profile,
      });

      console.log(`Created user: ${newUser.username} (${newUser.role})`);
    }

    console.log("Seeding completed ✅");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed ❌", error);
    process.exit(1);
  }
}

seedUsers();