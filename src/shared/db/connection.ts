// src/shared/db/connection.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { logger } from "../utils/logger";

export async function createConnection(connectionString: string) {
  try {
    const client = postgres(connectionString);
    return drizzle(client);
  } catch (error) {
    logger.error({ error }, "Database connection failed");
    throw error;
  }
}

export type Database = ReturnType<typeof createConnection>;
