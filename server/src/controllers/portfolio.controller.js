import Portfolio from "../models/Portfolio.js";
import { ensureDatabase } from "../middleware/requireDatabase.js";

/*
 * Portfolio controller — one portfolio per account.
 *
 * The user id always comes from the verified session (`req.user`), never from
 * the request body, so one account can never read or overwrite another's
 * portfolio.
 *
 * The portfolio payload itself is stored verbatim, exactly as the resume is:
 * the client owns the shape, and duplicating those rules on the server would
 * create a second contract that can drift. This layer only guarantees the
 * update is a plain object before persisting it.
 */

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/* ------------------------------------------------------------------ */
/* GET /api/portfolio                                                  */
/* ------------------------------------------------------------------ */

/**
 * Returns the stored portfolio.
 *
 * 404 with `{ portfolio: null }` means "this account has no portfolio yet",
 * which is deliberately different from returning an empty object: the client
 * needs to tell "nothing saved" apart from "saved but blank".
 */
export async function getPortfolio(req, res) {
  if (!ensureDatabase(res)) {
    return;
  }

  try {
    const document = await Portfolio.findOne({ user: req.user._id });

    if (!document) {
      return res.status(404).json({
        portfolio: null,
        activeTemplate: 1,
        message: "No portfolio has been saved for this account yet.",
      });
    }

    return res.status(200).json(document.toPublicJSON());
  } catch (error) {
    console.error("[error] Could not fetch portfolio:", error);

    return res.status(500).json({
      error: "internal_error",
      message: "Something went wrong on the server.",
    });
  }
}

/* ------------------------------------------------------------------ */
/* PUT /api/portfolio                                                  */
/* ------------------------------------------------------------------ */

/**
 * Creates or replaces the account's portfolio.
 *
 * The unique index on `user` makes this an upsert, so two concurrent PUTs
 * cannot create duplicate documents. Only the fields actually supplied in
 * the body are updated; omitted fields are left untouched.
 */
export async function upsertPortfolio(req, res) {
  const { portfolio, activeTemplate } = req.body ?? {};

  if (portfolio !== undefined && !isPlainObject(portfolio)) {
    return res.status(400).json({
      error: "invalid_portfolio",
      message: "Expected a portfolio object under the `portfolio` key.",
    });
  }

  if (
    activeTemplate !== undefined &&
    !Number.isInteger(activeTemplate)
  ) {
    return res.status(400).json({
      error: "validation_failed",
      message: "Please correct the highlighted fields.",
      fields: {
        activeTemplate: "Template must be a whole number.",
      },
    });
  }

  if (!ensureDatabase(res)) {
    return;
  }

  const updateData = {};

  if (portfolio !== undefined) {
    updateData.data = portfolio;
  }

  if (activeTemplate !== undefined) {
    updateData.activeTemplate = activeTemplate;
  }

  try {
    const document = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateData },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    return res.status(200).json(document.toPublicJSON());
  } catch (error) {
    console.error("[error] Could not upsert portfolio:", error);

    return res.status(500).json({
      error: "internal_error",
      message: "Something went wrong on the server.",
    });
  }
}

/* ------------------------------------------------------------------ */
/* PATCH /api/portfolio                                                */
/* ------------------------------------------------------------------ */

/**
 * Partial update — used for fast template switches without rewriting the
 * whole portfolio payload.
 */
export async function updateTemplate(req, res) {
  const { activeTemplate } = req.body ?? {};

  if (!Number.isInteger(activeTemplate)) {
    return res.status(400).json({
      error: "validation_failed",
      message: "Please correct the highlighted fields.",
      fields: {
        activeTemplate: "Template must be a whole number.",
      },
    });
  }

  if (!ensureDatabase(res)) {
    return;
  }

  try {
    const document = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      { $set: { activeTemplate } },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    return res.status(200).json(document.toPublicJSON());
  } catch (error) {
    console.error("[error] Could not update portfolio template:", error);

    return res.status(500).json({
      error: "internal_error",
      message: "Something went wrong on the server.",
    });
  }
}