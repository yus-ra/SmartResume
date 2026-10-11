import { Router } from "express";

import { getPortfolio, upsertPortfolio, updateTemplate } from "../controllers/portfolio.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireDatabase } from "../middleware/requireDatabase.js";

const router = Router();

// Portfolio lookups and writes both need MongoDB, so gate the whole router
// before the per-route auth check. A request that cannot reach the database
// is answered 503 rather than being left hanging.
router.use(requireDatabase);
router.use(requireAuth);

router.get("/", getPortfolio);
router.put("/", upsertPortfolio);
router.patch("/", updateTemplate);

export default router;