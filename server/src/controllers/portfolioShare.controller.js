import Portfolio from "../models/Portfolio.js";
import { ensureDatabase } from "../middleware/requireDatabase.js";
import { createShareSlug } from "../lib/share.js";

/*
 * Share-link management for the signed-in owner.
 *
 * Every handler here is behind `requireAuth`, and the user id always comes from
 * the verified session — never from the body or the path — so one account can
 * never enable, revoke or rotate another account's public link.
 *
 * The share state lives in its own typed subdocument (see models/Portfolio.js)
 * rather than in the client-owned `data` blob. These routes are the ONLY way it
 * can change; saving a portfolio cannot publish it, and publishing cannot alter
 * the portfolio content.
 *
 * Note that enabling requires the portfolio to already exist. Creating an empty
 * one here would make `GET /api/portfolio` start answering 200 with empty data,
 * and the builder treats 404 as "nothing on the server yet, keep my local
 * edits". An empty document would therefore overwrite a user's unsaved work.
 * Refusing is both simpler and safer than special-casing that elsewhere.
 */

/** Slug collisions are astronomically unlikely, but not impossible. */
const MAX_SLUG_ATTEMPTS = 5;

const isDuplicateKeyError = (error) => error?.code === 11000;

/* ------------------------------------------------------------------ */
/* Response shape                                                      */
/* ------------------------------------------------------------------ */

/**
 * The share state, as the client needs it.
 *
 * `publicPath` is returned origin-independent so the client can build a full
 * URL from `window.location.origin`. The server does not decide which host the
 * app is served from.
 */
const sharePayload = (portfolio) => {
  const slug = portfolio.share?.slug ?? null;

  return {
    share: {
      enabled: Boolean(portfolio.share?.enabled),
      slug,
      publishedAt: portfolio.share?.publishedAt ?? null,
      showContact: portfolio.share?.showContact === true,
      publicPath: slug ? `/p/${slug}` : null,
    },
  };
};

/** 409: the account has never saved a portfolio, so there is nothing to share. */
const sendNotSaved = (res) =>
  res.status(409).json({
    error: "portfolio_not_saved",
    message: "Save your portfolio once before publishing it.",
  });

/* ------------------------------------------------------------------ */
/* Slug assignment                                                     */
/* ------------------------------------------------------------------ */

/**
 * Give this user's portfolio a slug, if it does not already have one.
 *
 * Two things make this safe under concurrency:
 *   - the filter requires `share.slug: null`, so a second in-flight request
 *     cannot replace a slug that has already been assigned; and
 *   - the unique index on `share.slug` rejects a collision with ANY other
 *     account, which is then retried with a fresh value.
 *
 * Returns the slug now in place, or null if none could be established.
 */
async function ensureSlug(userId) {
  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
    const slug = createShareSlug();

    try {
      const updated = await Portfolio.findOneAndUpdate(
        // `share.slug: null` matches both null and a missing path, so this also
        // covers documents created before sharing existed.
        { user: userId, "share.slug": null },
        { $set: { "share.slug": slug } },
        { new: true },
      );

      if (updated) {
        return updated.share?.slug ?? slug;
      }

      // Nothing was updated, which means a slug is already present — either set
      // by an earlier request or by a parallel one. Use whatever is there.
      const existing = await Portfolio.findOne({ user: userId });

      return existing?.share?.slug ?? null;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      // Another account already owns this value. Draw a new one and retry.
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* POST /api/portfolio/share — enable                                  */
/* ------------------------------------------------------------------ */

/**
 * Turn the public link on, minting a slug on first use.
 *
 * Idempotent: publishing an already-published portfolio is a success and
 * returns the SAME link, so a double click or a retry cannot invalidate a link
 * the owner has already shared.
 */
export async function enablePortfolioShare(req, res) {
  if (!ensureDatabase(res)) {
    return;
  }

  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      return sendNotSaved(res);
    }

    if (!portfolio.share?.slug) {
      const slug = await ensureSlug(req.user._id);

      if (!slug) {
        return res.status(503).json({
          error: "share_unavailable",
          message: "Could not create a share link. Please try again.",
        });
      }
    }

    const updated = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      { $set: { "share.enabled": true, "share.publishedAt": new Date() } },
      { new: true },
    );

    return res.status(200).json(sharePayload(updated));
  } catch (error) {
    console.error("[error] Could not enable portfolio sharing:", error);

    return res.status(500).json({
      error: "internal_error",
      message: "Something went wrong on the server.",
    });
  }
}

/* ------------------------------------------------------------------ */
/* DELETE /api/portfolio/share — revoke                                */
/* ------------------------------------------------------------------ */

/**
 * Turn the public link off.
 *
 * The slug is deliberately KEPT: it is what lets the owner switch sharing back
 * on and hand out the same URL again. Only `enabled` changes, and because the
 * public controller filters on `enabled: true` in the query itself, the link
 * stops working on the very next request.
 *
 * Idempotent: revoking an already-private portfolio is a success.
 */
export async function revokePortfolioShare(req, res) {
  if (!ensureDatabase(res)) {
    return;
  }

  try {
    const updated = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      { $set: { "share.enabled": false } },
      { new: true },
    );

    if (!updated) {
      return sendNotSaved(res);
    }

    return res.status(200).json(sharePayload(updated));
  } catch (error) {
    console.error("[error] Could not revoke portfolio sharing:", error);

    return res.status(500).json({
      error: "internal_error",
      message: "Something went wrong on the server.",
    });
  }
}

/* ------------------------------------------------------------------ */
/* PATCH /api/portfolio/share — settings and slug rotation              */
/* ------------------------------------------------------------------ */

/**
 * Adjust the published page, or replace the link with a fresh one.
 *
 * Accepts, independently:
 *   showContact  boolean  whether contact details appear publicly
 *   rotate       boolean  whether to invalidate the current link
 *
 * Rotation is the tool for "I sent that link to the wrong person": it mints a
 * new slug, so the old URL 404s immediately even while the portfolio stays
 * published.
 */
export async function updatePortfolioShare(req, res) {
  const { showContact, rotate } = req.body ?? {};

  if (showContact !== undefined && typeof showContact !== "boolean") {
    return res.status(400).json({
      error: "validation_failed",
      message: "Please correct the highlighted fields.",
      fields: { showContact: "Must be true or false." },
    });
  }

  if (rotate !== undefined && typeof rotate !== "boolean") {
    return res.status(400).json({
      error: "validation_failed",
      message: "Please correct the highlighted fields.",
      fields: { rotate: "Must be true or false." },
    });
  }

  if (showContact === undefined && rotate !== true) {
    return res.status(400).json({
      error: "validation_failed",
      message: "Please correct the highlighted fields.",
      fields: {
        share: "Provide showContact, rotate, or both.",
      },
    });
  }

  if (!ensureDatabase(res)) {
    return;
  }

  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      return sendNotSaved(res);
    }

    const update = {};

    if (showContact !== undefined) {
      update["share.showContact"] = showContact;
    }

    if (rotate === true) {
      const slug = await mintRotatedSlug(req.user._id);

      if (!slug) {
        return res.status(503).json({
          error: "share_unavailable",
          message: "Could not create a new share link. Please try again.",
        });
      }
    }

    /*
     * Applied only when there is something to apply. A rotation on its own has
     * already been written by `mintRotatedSlug`, and MongoDB rejects an empty
     * update document outright, so this cannot be expressed as a single
     * conditional $set.
     */
    if (Object.keys(update).length > 0) {
      await Portfolio.findOneAndUpdate(
        { user: req.user._id },
        { $set: update },
        { new: true },
      );
    }

    // Re-read so the response reflects every change made above, whichever path
    // produced it.
    const updated = await Portfolio.findOne({ user: req.user._id });

    return res.status(200).json(sharePayload(updated));
  } catch (error) {
    console.error("[error] Could not update portfolio sharing:", error);

    return res.status(500).json({
      error: "internal_error",
      message: "Something went wrong on the server.",
    });
  }
}

/**
 * Replace the user's slug with a brand new one, retrying on collision.
 *
 * Unlike `ensureSlug`, this overwrites unconditionally — that is the point.
 * Returns the new slug, or null if every attempt collided.
 */
async function mintRotatedSlug(userId) {
  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
    const slug = createShareSlug();

    try {
      const updated = await Portfolio.findOneAndUpdate(
        { user: userId },
        { $set: { "share.slug": slug } },
        { new: true },
      );

      if (updated) {
        return updated.share?.slug ?? slug;
      }

      return null;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
    }
  }

  return null;
}
