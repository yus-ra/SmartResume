import { Router } from "express";

import {
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
  updateProfile,
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

/*
 * Forgot-password and reset-password are NOT gated here: each validates its
 * payload first and only then reports an unavailable database via
 * `ensureDatabase`, so a malformed request is answered 400 even while MongoDB
 * is down. Reset is deliberately NOT gated by `requireAuth`: the whole point
 * is to recover access without a session.
 */
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/logout", logout);

router.get("/me", requireDatabase, requireAuth, me);
router.patch("/me", requireDatabase, requireAuth, updateProfile);

export default router;