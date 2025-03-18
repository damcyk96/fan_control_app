import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { migrateDatabase } from "./migrate"; // Import the migration function
import { logger } from "../../../shared/utils/logger";

// Get database connection string from environment variables
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/fan_control";

// Create a PostgreSQL client
const client = postgres(connectionString, {
  max: 10, // Connection pool max size
  idle_timeout: 20, // Idle connection timeout in seconds
  onnotice: (notice) => logger.info(notice),
  onparameter: (param) => logger.debug(param),
});

export const db = drizzle(client, { schema });

// Function to initialize database with retries
export async function initializeDatabase(retries = 5, delay = 3000) {
  let currentRetry = 0;

  while (currentRetry < retries) {
    try {
      logger.info(
        `Checking database connection (attempt ${
          currentRetry + 1
        }/${retries})...`
      );
      await client`SELECT 1`;
      logger.info("Database connection successful");

      // Run migrations after successful connection
      const migrationSuccess = await migrateDatabase();
      if (!migrationSuccess) {
        logger.error("Database migration failed");
        return false;
      }

      return true;
    } catch (error) {
      currentRetry++;
      logger.warn(
        { error, currentRetry, retries },
        `Database connection failed, ${retries - currentRetry} retries left`
      );

      if (currentRetry >= retries) {
        logger.error(
          { error },
          "Max retries reached. Database connection failed"
        );
        return false;
      }

      // Wait before retrying
      logger.info(`Waiting ${delay}ms before retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return false;
}
