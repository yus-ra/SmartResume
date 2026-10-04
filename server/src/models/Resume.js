import mongoose from "mongoose";

/*
 * The user's single canonical resume.
 *
 * The `resume` field is Mixed on purpose. The canonical schema is defined
 * exactly once, in the client module `lib/resumeSchema.js`. Re-declaring those
 * fields here would create a second definition that can silently drift from
 * the first — the exact class of problem the earlier architecture work removed.
 * The stored object is therefore kept verbatim and normalised by the client
 * on read.
 *
 * `schemaVersion` is stored alongside it so a future shape change can be
 * detected and migrated, rather than guessed at.
 */

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Enforces one resume per account at the database level, so two
      // concurrent upserts can never produce a second document.
      unique: true,
      index: true,
    },

    resume: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: () => ({}),
    },

    schemaVersion: {
      type: Number,
      required: true,
      default: 1,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/**
 * Shape returned to the client.
 *
 * `updatedAt` is included so the client can show an honest "last synced"
 * time. It is server truth, not something the client should invent.
 */
resumeSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    resume: this.resume,
    schemaVersion: this.schemaVersion,
    updatedAt: this.updatedAt,
  };
};

export const Resume = mongoose.model("Resume", resumeSchema);