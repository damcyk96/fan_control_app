import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { logger } from "../../../shared/utils/logger";

export async function migrateDatabase() {
  try {
    logger.info("Starting database migration...");

    const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
    const db = drizzle(migrationClient);

    await migrate(db, { migrationsFolder: "./drizzle" });

    logger.info("Database migration completed successfully");

    await migrationClient.end();
    return true;
  } catch (error) {
    logger.error({ error }, "Database migration failed");
    return false;
  }
}
