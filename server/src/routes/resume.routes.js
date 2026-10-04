import { Router } from "express";

import {
  deleteResume,
  getResume,
  putResume,
} from "../controllers/resume.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireDatabase } from "../middleware/requireDatabase.js";

const router = Router();

/*
 * Every route here needs a verified session AND the database: the user id
 * comes from the session and all reads/writes hit MongoDB.
 *
 * requireDatabase runs first so an outage is reported as 503 rather than as a
 * misleading 401.
 */
router.use(requireDatabase, requireAuth);

router.get("/", getResume);
router.put("/", putResume);
router.delete("/", deleteResume);

export default router;