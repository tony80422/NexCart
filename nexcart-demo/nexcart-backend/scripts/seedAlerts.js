import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

import { connectDB } from "../src/config/db.js";
import { Alert } from "../src/models/Alert.js";

const alertSeeds = [
  {
    level: "High",
    title: "Repeated failed login attempts",
    message: "Multiple failed login attempts were detected on the authentication service.",
    status: "Open",
  },
  {
    level: "Medium",
    title: "Abnormal API latency detected",
    message: "Average response time exceeded the warning threshold for several requests.",
    status: "Investigating",
  },
  {
    level: "Low",
    title: "Cloud storage lifecycle warning",
    message: "Object lifecycle rules require review for archived files.",
    status: "Resolved",
  },
  {
    level: "High",
    title: "Suspicious admin route access",
    message: "Unauthorized requests attempted to access protected administrator endpoints.",
    status: "Open",
  },
  {
    level: "Medium",
    title: "Inventory inconsistency detected",
    message: "One or more products reported a stock mismatch after recent order updates.",
    status: "Investigating",
  },
  {
    level: "Low",
    title: "Background job delayed",
    message: "A scheduled maintenance or reporting task completed later than expected.",
    status: "Resolved",
  },
];

async function seedAlerts() {
  try {
    await connectDB();

    console.log("Seeding alerts...");

    for (const alertData of alertSeeds) {
      const exists = await Alert.findOne({
        title: alertData.title,
        level: alertData.level,
      });

      if (exists) {
        console.log(`Alert already exists: ${alertData.title}`);
        continue;
      }

      const newAlert = await Alert.create(alertData);
      console.log(`Created alert: ${newAlert.title}`);
    }

    console.log("Alert seeding completed ✅");
    process.exit(0);
  } catch (error) {
    console.error("Alert seeding failed ❌", error);
    process.exit(1);
  }
}

seedAlerts();