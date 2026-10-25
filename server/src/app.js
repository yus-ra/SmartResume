import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { getConnectionState } from "./config/db.js";
import { attachUser } from "./middleware/auth.js";
import authRoutes from "./routes/auth.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import publicRoutes from "./routes/public.routes.js";
import aiRoutes from "./routes/ai.routes.js";

export function createApp() {
  const app = express();

  /*
   * Render's Express example uses one trusted hop. Its current networking
   * guidance describes Cloudflare and Render load balancers but does not
   * guarantee the X-Forwarded-For hop count observed by every service. Verify
   * req.ip on the deployed service; keep this bounded rather than trusting all
   * forwarded addresses, and revisit it if another proxy is added.
   */
  app.set("trust proxy", 1);

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
  app.use("/api/resume", resumeRoutes);
  app.use("/api/portfolio", portfolioRoutes);
  app.use("/api/ai", aiRoutes);

  /*
   * Anonymous, read-only routes.
   *
   * Mounted LAST among the real routers and immediately BEFORE the `/api`
   * catch-all below, so the catch-all still owns every unmatched path under
   * `/api` and this cannot accidentally shadow or be shadowed by another
   * router.
   *
   * `attachUser` above still runs for these requests — it never rejects, and a
   * visitor with a session simply gets `req.user` populated and ignored.
   */
  app.use("/api/public", publicRoutes);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "not_found", message: "No such endpoint." });
  });

  // Final error handler. Never leak a stack trace to the client.
  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    // Do not emit error objects: driver and provider errors can contain
    // request data, account details, or other sensitive context.
    console.error("[error] Request failed.");

    res.status(500).json({
      error: "internal_error",
      message: "Something went wrong on the server.",
    });
  });

  return app;
}
