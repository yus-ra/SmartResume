import { Router } from "express";

import { getPublicPortfolio } from "../controllers/publicPortfolio.controller.js";
import { requireDatabase } from "../middleware/requireDatabase.js";
import { createRateLimit } from "../middleware/rateLimit.js";

/*
 * Unauthenticated routes.
 *
 * These are the only endpoints in the server that answer without a session, so
 * the shape of this file matters:
 *
 *   - `requireDatabase` is applied, exactly as on the authenticated routers, so
 *     a database outage is reported as 503 rather than as a misleading 404
 *     that would imply the portfolio does not exist.
 *   - `requireAuth` is deliberately ABSENT. It cannot simply be dropped from
 *     portfolio.routes.js, because that router applies it with `router.use()`
 *     and every route on it needs it; a public route therefore belongs in its
 *     own router. That is why this file exists rather than a fourth handler in
 *     the existing one.
 *
 * Anything added here is reachable by the whole internet. Keep it to published,
 * read-only data.
 */

const router = Router();

/**
 * Enumeration guard.
 *
 * Slug guessing is the attack this endpoint invites, and each guess costs two
 * database lookups. 60 requests per minute from one address is far above what a
 * human following shared links produces and far below what walking a keyspace
 * needs.
 */
const publicReadLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many requests. Please slow down and try again shortly.",
});

router.use(requireDatabase);

router.get("/portfolios/:slug", publicReadLimit, getPublicPortfolio);

export default router;
