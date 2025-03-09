import { Hono } from "hono";
import { logger, logRequestStart, logRequestComplete } from "./utils/logger";
import { initializeDatabase } from "./db";
import fanRouter from "./routes/fanRoutes";
import { serve } from "bun";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Hono app
const app = new Hono();

// Middleware to log requests
app.use("*", async (c, next) => {
  const start = performance.now();
  logRequestStart(c.req);

  await next();

  const end = performance.now();
  logRequestComplete(c.req, c.res, end - start);
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.route("/api/fans", fanRouter);

// Error handling
app.onError((err, c) => {
  logger.error({ error: err }, "Unhandled error");
  return c.json({ success: false, error: "Internal server error" }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: "Endpoint not found" }, 404);
});

// Initialize server
const PORT = parseInt(process.env.PORT || "3000", 10);

async function startServer() {
  try {
    // Initialize database connection
    const dbInitialized = await initializeDatabase();

    if (!dbInitialized) {
      logger.error("Failed to initialize database. Exiting...");
      process.exit(1);
    }

    // Check if HTTPS is enabled
    const useHttps = process.env.USE_HTTPS === "true";

    if (useHttps) {
      try {
        // Load SSL certificates
        const certPath = join(process.cwd(), "certs", "cert.pem");
        const keyPath = join(process.cwd(), "certs", "key.pem");

        const cert = readFileSync(certPath);
        const key = readFileSync(keyPath);

        // Start HTTPS server
        const server = serve({
          fetch: app.fetch,
          port: PORT,
          tls: {
            cert,
            key,
          },
        });

        logger.info(`HTTPS server started on https://localhost:${PORT}`);
      } catch (error) {
        logger.error(
          { error },
          "Failed to load SSL certificates, falling back to HTTP"
        );

        // Fall back to HTTP
        const server = serve({
          fetch: app.fetch,
          port: PORT,
        });

        logger.info(`HTTP server started on http://localhost:${PORT}`);
      }
    } else {
      // Start HTTP server
      const server = serve({
        fetch: app.fetch,
        port: PORT,
      });

      logger.info(`HTTP server started on http://localhost:${PORT}`);
    }
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

// Start the server
startServer();
