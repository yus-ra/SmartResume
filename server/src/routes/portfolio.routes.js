import { Router } from "express";

import { getPortfolio, upsertPortfolio, updateTemplate } from "../controllers/portfolio.controller.js";
import {
  enablePortfolioShare,
  revokePortfolioShare,
  updatePortfolioShare,
} from "../controllers/portfolioShare.controller.js";
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

/*
 * Public share-link management for the owner.
 *
 * These belong on the AUTHENTICATED router: publishing and revoking are
 * changes to the owner's own account, and the user id must come from the
 * session. The one route that is anonymous — reading a published portfolio —
 * lives in routes/public.routes.js, because this router's `requireAuth`
 * applies to everything on it.
 *
 * Declared after "/" because Express matches paths exactly: "/share" is not
 * shadowed by "/", and the two cannot be confused.
 */
router.post("/share", enablePortfolioShare);
router.patch("/share", updatePortfolioShare);
router.delete("/share", revokePortfolioShare);

export default router;
