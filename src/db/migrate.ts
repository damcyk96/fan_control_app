import { db } from "./index";
import { fans, temperatureReadings, fanHistory } from "./schema";
import { logger } from "../utils/logger";
import { sql } from "drizzle-orm";

export async function migrateDatabase() {
  try {
    logger.info("Starting database migration...");

    // Create schema if not exists
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS public`);

    // Create tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        is_active BOOLEAN DEFAULT false NOT NULL,
        speed INTEGER DEFAULT 0,
        temperature_threshold INTEGER DEFAULT 25,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS temperature_readings (
        id SERIAL PRIMARY KEY,
        fan_id INTEGER REFERENCES fans(id) NOT NULL,
        temperature INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fan_history (
        id SERIAL PRIMARY KEY,
        fan_id INTEGER REFERENCES fans(id) NOT NULL,
        action VARCHAR(50) NOT NULL,
        old_value VARCHAR(50),
        new_value VARCHAR(50),
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Check if we already have fans in the database
    const existingFans = await db.select().from(fans);

    // If no fans exist, create some default ones
    if (existingFans.length === 0) {
      logger.info("Creating default fans...");

      // Create sample fans
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
    } else {
      logger.info(
        `Found ${existingFans.length} existing fans, skipping creation of default fans`
      );
    }

    logger.info("Database migration completed successfully");
    return true;
  } catch (error) {
    logger.error({ error }, "Database migration failed");
    return false;
  }
}
