import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

// Fan table schema
export const fans = pgTable("fans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  location: varchar("location", { length: 255 }),
  isActive: boolean("is_active").default(false).notNull(),
  speed: integer("speed").default(0),
  temperatureThreshold: integer("temperature_threshold").default(25),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Fan temperature readings table schema
export const temperatureReadings = pgTable("temperature_readings", {
  id: serial("id").primaryKey(),
  fanId: integer("fan_id")
    .references(() => fans.id)
    .notNull(),
  temperature: integer("temperature").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Fan history table schema
export const fanHistory = pgTable("fan_history", {
  id: serial("id").primaryKey(),
  fanId: integer("fan_id")
    .references(() => fans.id)
    .notNull(),
  action: varchar("action", { length: 50 }).notNull(), // e.g., "turned_on", "turned_off", "speed_changed"
  oldValue: varchar("old_value", { length: 50 }),
  newValue: varchar("new_value", { length: 50 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Types
export type Fan = typeof fans.$inferSelect;
export type NewFan = typeof fans.$inferInsert;

export type TemperatureReading = typeof temperatureReadings.$inferSelect;
export type NewTemperatureReading = typeof temperatureReadings.$inferInsert;

export type FanHistory = typeof fanHistory.$inferSelect;
export type NewFanHistory = typeof fanHistory.$inferInsert;
