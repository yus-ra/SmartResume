import { Router } from "express";

import { explainMatch } from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/*
 * The explanation endpoint is authenticated. It is deliberately NOT gated by
 * `requireDatabase` at the router level: the controller validates its payload
 * FIRST, so a malformed request is answered 400 even while MongoDB is down.
 * Only after validation does the controller report an unavailable database via
 * `ensureDatabase`, matching the pattern used by /auth/forgot-password and
 * /auth/reset-password.
 *
 * The AI service itself is optional: when GEMINI_API_KEY is absent the
 * controller answers 503 and the app keeps working.
 */
router.post("/explain-match", requireAuth, explainMatch);

export default router;