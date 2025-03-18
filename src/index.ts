// src/index.ts
import { serve } from "bun";
import { logger } from "./shared/utils/logger";
import { createConnection } from "./shared/db/connection";
import { getFanManagement } from "./features/fan-management/FanManagement";
import { FanApi } from "./features/fan-management/api";
import dotenv from "dotenv";
import { z } from "zod";

// Environment validation schema
const EnvSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("3000"),
  DATABASE_URL: z.string(),
});

type EnvConfig = z.infer<typeof EnvSchema>;

export async function initializeServer(env: Record<string, string>) {
  // Validate environment configuration
  const validatedConfig = EnvSchema.safeParse(env);

  if (!validatedConfig.success) {
    throw new Error(
      `Invalid environment configuration: ${validatedConfig.error}`
    );
  }

  const config = validatedConfig.data;

  try {
    // Initialize database connection
    const db = await createConnection(config.DATABASE_URL);

    // Initialize fan management
    const fanManagement = await getFanManagement(db);

    // Initialize API with fan management instance
    const fanApi = new FanApi(fanManagement);

    return { config, db, fanApi };
  } catch (error) {
    logger.error({ error }, "Failed to initialize server");
    throw error;
  }
}

export async function startServer(configPath?: string) {
  try {
    // Load environment variables
    const env = configPath
      ? dotenv.config({ path: configPath }).parsed || {}
      : process.env;

    // Initialize server components
    const { config, fanApi } = await initializeServer(env);

    // Start server
    serve({
      port: config.PORT,
      // Routes configuration
      routes: {
        // Health check
        "/health": () =>
          Response.json({
            status: "ok",
            timestamp: new Date().toISOString(),
          }),

        // Fan management routes
        "/api/fans": {
          GET: (req) => fanApi.getAllFans(req),
          POST: (req) => fanApi.createFan(req),
        },

        "/api/fans/:id": {
          GET: (req) => fanApi.getFanById(req, req.params.id),
          PUT: (req) => fanApi.updateFan(req, req.params.id),
          DELETE: (req) => fanApi.deleteFan(req, req.params.id),
        },

        "/api/fans/:id/toggle": {
          POST: (req) => fanApi.toggleFanState(req, req.params.id),
        },

        "/api/fans/:id/speed": {
          POST: (req) => fanApi.setFanSpeed(req, req.params.id),
        },

        // Catch-all for unmatched API routes
        "/api/*": () =>
          Response.json(
            { success: false, error: "Endpoint not found" },
            { status: 404 }
          ),
      },

      // Error handling
      error(error) {
        logger.error({ error }, "Server error");
        return Response.json(
          { success: false, error: "Internal server error" },
          { status: 500 }
        );
      },
    });

    logger.info(`Server started on http://localhost:${config.PORT}`);
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

// For testing
export async function createTestServer(testEnv: Record<string, string>) {
  return await initializeServer(testEnv);
}

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}
