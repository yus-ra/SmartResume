import mongoose from "mongoose";

/*
 * Portfolio share settings.
 *
 * This is deliberately a TYPED top-level subdocument rather than a
 * `published` flag inside `data`.
 *
 * `data` is a Mixed blob whose shape is owned by the client (see
 * controllers/portfolio.controller.js), so a flag stored there is:
 *   - unvalidated, so a typo or a `"false"` string silently reads as truthy;
 *   - client-writable, so nothing about it can be trusted as a gate;
 *   - impossible to query efficiently, because it is not an indexed path.
 *
 * A public endpoint is a security boundary, so the state that decides whether a
 * portfolio is visible is modelled explicitly, moved only by dedicated
 * authenticated routes, and indexed.
 */

const shareSchema = new mongoose.Schema(
  {
    /**
     * Whether the public link is live. Checked on EVERY public read, so
     * revoking takes effect immediately rather than when a cache expires.
     */
    enabled: {
      type: Boolean,
      default: false,
    },

    /**
     * Opaque, unguessable public identifier. 128 bits of entropy (see
     * lib/share.js), so a public link cannot be walked by guessing id after id.
     *
     * Null until sharing is first enabled. Kept when sharing is switched off so
     * that re-enabling restores the same URL, and rotated only on an explicit
     * request.
     */
    slug: {
      type: String,
      default: null,
      trim: true,
    },

    /** When the link was most recently enabled. Informational. */
    publishedAt: {
      type: Date,
      default: null,
    },

    /**
     * Whether the owner's contact details (currently the email address) appear
     * on the public page. Contact details are private unless the owner opts in.
     */
    showContact: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Enforces 1:1 portfolio per account at the database level
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {}, // The frontend owns the shape of this data
    },
    activeTemplate: {
      type: Number,
      default: 1,
    },

    share: {
      type: shareSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

/*
 * Only actual string slugs participate in uniqueness. The partial filter
 * excludes both explicit null defaults and missing fields, so unpublished
 * portfolios do not occupy the slug namespace. Existing documents need no
 * data backfill: their null or missing slug fields remain valid. If the older
 * sparse index has already been created in a database, replace it with
 * `npm run migrate:portfolio-share-index` before deploying this schema.
 */
portfolioSchema.index(
  { "share.slug": 1 },
  {
    unique: true,
    partialFilterExpression: { "share.slug": { $type: "string" } },
    name: "share_slug_unique",
  },
);

/** Shape returned to the signed-in owner. Includes their share settings. */
portfolioSchema.methods.toPublicJSON = function () {
  return {
    portfolio: this.data,
    activeTemplate: this.activeTemplate,
    updatedAt: this.updatedAt,
    share: {
      enabled: Boolean(this.share?.enabled),
      slug: this.share?.slug ?? null,
      publishedAt: this.share?.publishedAt ?? null,
      showContact: this.share?.showContact === true,
    },
  };
};

const Portfolio = mongoose.model("Portfolio", portfolioSchema);
export default Portfolio;
