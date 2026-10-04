import { Resume } from "../models/Resume.js";

/*
 * Resume controller — single resume per user.
 *
 * The user id always comes from the verified session (`req.user`), never from
 * the request body, so one account can never read or overwrite another's
 * resume.
 *
 * The canonical schema itself is NOT validated here. It is owned by the
 * client's `lib/resumeSchema.js`; duplicating those rules on the server would
 * create a second contract that can drift. This layer only guarantees the
 * payload is a plain object before storing it verbatim.
 */

const SUPPORTED_SCHEMA_VERSION = 1;

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** 400 helper for a rejected payload. */
function sendInvalid(res, message) {
  return res.status(400).json({
    error: "invalid_resume",
    message,
  });
}

/* ------------------------------------------------------------------ */
/* GET /api/resume                                                      */
/* ------------------------------------------------------------------ */

/**
 * Returns the stored resume.
 *
 * 404 with `{ resume: null }` means "this account has no resume yet", which is
 * deliberately different from returning an empty object: the client needs to
 * tell "nothing saved" apart from "saved but blank".
 */
export async function getResume(req, res) {
  const document = await Resume.findOne({ user: req.user._id });

  if (!document) {
    return res.status(404).json({
      resume: null,
      message: "No resume has been saved for this account yet.",
    });
  }

  return res.status(200).json(document.toPublicJSON());
}

/* ------------------------------------------------------------------ */
/* PUT /api/resume                                                      */
/* ------------------------------------------------------------------ */

/**
 * Creates or replaces the user's resume.
 *
 * The unique index on `user` makes this an upsert, so two concurrent PUTs
 * cannot create duplicate documents.
 */
export async function putResume(req, res) {
  const incoming = req.body?.resume;

  if (!isPlainObject(incoming)) {
    return sendInvalid(
      res,
      "Expected a resume object under the `resume` key.",
    );
  }

  // Stored verbatim. The client normalises on read.
  const payload = incoming;

  const schemaVersion = Number.isInteger(req.body?.schemaVersion)
    ? req.body.schemaVersion
    : SUPPORTED_SCHEMA_VERSION;

  if (schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return res.status(400).json({
      error: "unsupported_schema_version",
      message: `This server stores schema version ${SUPPORTED_SCHEMA_VERSION}; received ${schemaVersion}.`,
    });
  }

  const document = await Resume.findOneAndUpdate(
    { user: req.user._id },
    { $set: { resume: payload, schemaVersion } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  return res.status(200).json(document.toPublicJSON());
}

/* ------------------------------------------------------------------ */
/* DELETE /api/resume                                                   */
/* ------------------------------------------------------------------ */

/**
 * Removes the server copy. Deleting something that is not there is a success,
 * not an error, so the route stays idempotent.
 */
export async function deleteResume(req, res) {
  await Resume.deleteOne({ user: req.user._id });

  return res.status(204).send();
}