import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { getConnectionState } from "./config/db.js";
import { attachUser } from "./middleware/auth.js";
import authRoutes from "./routes/auth.routes.js";

export function createApp() {
  const app = express();

  /*
   * Credentials must be allowed for the session cookie to survive a
   * cross-origin request from the Vite dev server.
   */
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Populates req.user when a valid session cookie is present.
  app.use(attachUser);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "smartresume-server",
      database: getConnectionState(),
      env: env.nodeEnv,
    });
  });

  app.use("/api/auth", authRoutes);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "not_found", message: "No such endpoint." });
  });

  // Final error handler. Never leak a stack trace to the client.
  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    console.error("[error]", error);

    res.status(500).json({
      error: "internal_error",
      message: "Something went wrong on the server.",
    });
  });

  return app;
}