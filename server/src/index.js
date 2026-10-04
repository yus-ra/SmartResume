import "dotenv/config";

import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

/*
 * Server entry point.
 *
 * Startup order matters: the database attempt is awaited to completion
 * (success or failure) BEFORE the port opens, so no request can observe an
 * unknown connection state. A failed connection never prevents the process
 * from running.
 */

async function start() {
  const connected = await connectDatabase();

  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log("");
    console.log(`[server] SmartResume API listening on http://localhost:${env.port}`);
    console.log(`[server] Environment: ${env.nodeEnv}`);
    console.log(`[server] Client origin: ${env.clientOrigin}`);
    console.log(
      connected
        ? "[server] Database: connected"
        : "[server] Database: unavailable — database routes will return 503",
    );
    console.log("");
  });

  const shutdown = (signal) => {
    console.log(`\n[server] ${signal} received, shutting down.`);

    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });

    // Do not hang forever on a stuck connection.
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  // Only configuration problems land here (for example a missing JWT_SECRET
  // in production), which genuinely must stop the process.
  console.error("[server] ✖ Failed to start:", error.message);
  process.exit(1);
});