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
 * Register and login are NOT gated here: each validates its payload first and
 * only then reports an unavailable database via `ensureDatabase`, so a
 * malformed request is answered 400 even while MongoDB is down.
 *
 * `/me` is gated, because deciding whether a session is valid genuinely
 * requires the database.
 *
 * Logout is deliberately NOT gated: clearing a cookie is purely a client-side
 * concern, and a user must never be stuck in a signed-in state because the
 * server lost its database.
 */
router.post("/register", register);
router.post("/login", login);

router.post("/logout", logout);

router.get("/me", requireDatabase, requireAuth, me);

export default router;