import { Router } from "express";

import {
  login,
  logout,
  me,
  register,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireDatabase } from "../middleware/requireDatabase.js";

const router = Router();

/*
 * Database-backed routes are gated per-route by `requireDatabase` so they
 * answer 503 while the connection is down.
 *
 * Logout is deliberately NOT gated: clearing a cookie is purely a client-side
 * concern, and a user must never be stuck in a signed-in state because the
 * server lost its database.
 */
router.post("/register", requireDatabase, register);
router.post("/login", requireDatabase, login);

router.post("/logout", logout);

router.get("/me", requireDatabase, requireAuth, me);

export default router;