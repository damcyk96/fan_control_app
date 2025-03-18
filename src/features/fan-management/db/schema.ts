import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  integer,
  uuid,
} from "drizzle-orm/pg-core";

// Fan table schema
export const fans = pgTable("fans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  location: varchar("location", { length: 255 }),
  isActive: boolean("is_active").default(false).notNull(),
  speed: integer("speed").default(0),
  temperatureThreshold: integer("temperature_threshold").default(25),
  createdAt: timestamp("created_at", {
    precision: 3,
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    precision: 3,
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

// Fan temperature readings table schema
export const temperatureReadings = pgTable("temperature_readings", {
  id: uuid("id").defaultRandom().primaryKey(),
  fanId: uuid("fan_id")
    .references(() => fans.id)
    .notNull(),
  temperature: integer("temperature").notNull(),
  timestamp: timestamp("timestamp", {
    precision: 3,
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

// Fan history table schema
export const fanHistory = pgTable("fan_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  fanId: uuid("fan_id")
    .references(() => fans.id)
    .notNull(),
  action: varchar("action", { length: 50 }).notNull(), // e.g., "turned_on", "turned_off", "speed_changed"
  oldValue: varchar("old_value", { length: 50 }),
  newValue: varchar("new_value", { length: 50 }),
  timestamp: timestamp("timestamp", {
    precision: 3,
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

// Types
export type Fan = typeof fans.$inferSelect;
export type NewFan = typeof fans.$inferInsert;

export type TemperatureReading = typeof temperatureReadings.$inferSelect;
export type NewTemperatureReading = typeof temperatureReadings.$inferInsert;

export type FanHistory = typeof fanHistory.$inferSelect;
export type NewFanHistory = typeof fanHistory.$inferInsert;
