// src/db/seed.ts
import { db } from "./db";
import { fans } from "./schema";
import { logger } from "../../../shared/utils/logger";

export async function seedDatabase() {
  try {
    const existingFans = await db.select().from(fans);

    if (existingFans.length === 0) {
      logger.info("Seeding default fans...");

      await db.insert(fans).values([
        {
          name: "Living Room Fan",
          location: "Living Room",
          isActive: false,
          speed: 0,
          temperatureThreshold: 25,
        },
        {
          name: "Bedroom Fan",
          location: "Master Bedroom",
          isActive: false,
          speed: 0,
          temperatureThreshold: 23,
        },
        {
          name: "Kitchen Fan",
          location: "Kitchen",
          isActive: true,
          speed: 2,
          temperatureThreshold: 28,
        },
        {
          name: "Office Fan",
          location: "Home Office",
          isActive: false,
          speed: 0,
          temperatureThreshold: 24,
        },
      ]);

      logger.info("Default fans created successfully");
    }
  } catch (error) {
    logger.error({ error }, "Database seeding failed");
  }
}
