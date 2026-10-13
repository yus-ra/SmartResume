import Portfolio from "../models/Portfolio.js";
import { Resume } from "../models/Resume.js";
import { projectPublicPortfolio } from "../lib/publicPortfolio.js";
import { isPlausibleSlug } from "../lib/share.js";

/*
 * The ONLY unauthenticated controller in this server.
 *
 * Everything else reads the user id from the session (`req.user`) and can
 * therefore only ever reach the caller's own data. This one is handed an
 * arbitrary slug by an anonymous visitor, so every decision here is a security
 * decision. Four rules hold it together:
 *
 *   1. The slug is validated for shape BEFORE any database work.
 *   2. `enabled: true` is part of the QUERY, so a revoked portfolio is never
 *      loaded. Revocation is therefore immediate — there is no cache to expire
 *      and no window in which a revoked link still answers.
 *   3. Unknown, malformed and revoked slugs return the SAME 404. A different
 *      response for "exists but revoked" would confirm that a slug is real,
 *      which is exactly what an attacker enumerating links wants to know.
 *   4. The response is built by the allow-list in lib/publicPortfolio.js. Raw
 *      documents are never returned, so a field added elsewhere cannot leak
 *      here by accident.
 */

/** Identical for every reason a portfolio is not available. */
const NOT_FOUND_BODY = {
  error: "not_found",
  message: "This portfolio is not available.",
};

const sendNotFound = (res) => res.status(404).json(NOT_FOUND_BODY);

/* ------------------------------------------------------------------ */
/* GET /api/public/portfolios/:slug                                    */
/* ------------------------------------------------------------------ */

/**
 * Return one published portfolio for anonymous viewing.
 *
 * The resume is joined in at read time rather than copied into the portfolio
 * when sharing is enabled. Experience, education and skills are the resume's
 * (see the client's Portfolio builder, which renders them from the resume), and
 * a copy would start drifting the moment the owner edited their resume. The
 * join is one indexed lookup on a field that is already unique.
 */
export async function getPublicPortfolio(req, res) {
  const { slug } = req.params;

  // Shape check first: a malformed path must not reach MongoDB at all.
  if (!isPlausibleSlug(slug)) {
    return sendNotFound(res);
  }

  try {
    const portfolio = await Portfolio.findOne({
      "share.slug": slug,
      "share.enabled": true,
    });

    if (!portfolio) {
      return sendNotFound(res);
    }

    // A missing resume is normal (the portfolio is saved independently) and
    // simply yields empty experience / education / skills sections.
    const resumeDocument = await Resume.findOne({ user: portfolio.user });

    /*
     * `no-store` deliberately overrides any caching: a revoked link must stop
     * working on the very next request, and a cached 200 would defeat that both
     * in a shared proxy and in the visitor's own browser history.
     */
    res.set("Cache-Control", "no-store");

    return res.status(200).json(
      projectPublicPortfolio({
        portfolioData: portfolio.data,
        activeTemplate: portfolio.activeTemplate,
        resume: resumeDocument?.resume ?? null,
        showContact: portfolio.share?.showContact === true,
        updatedAt: portfolio.updatedAt,
      }),
    );
  } catch (error) {
    console.error("[error] Could not serve public portfolio:", error);

    return res.status(500).json({
      error: "internal_error",
      message: "Something went wrong on the server.",
    });
  }
}
