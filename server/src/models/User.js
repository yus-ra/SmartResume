import mongoose from "mongoose";

/*
 * User account.
 *
 * The password hash is never selected by default, so an accidental
 * `User.findOne()` cannot leak it into a response. `toPublicJSON()` is the
 * only sanctioned way to shape a user for the wire.
 */

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    surname: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // bcrypt hash. `select: false` keeps it out of ordinary queries.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
    versionKey: false,
  },
);

/** Shape sent to the client. Deliberately mirrors the existing client user. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    surname: this.surname,
    fullName: `${this.firstName}${this.surname ? ` ${this.surname}` : ""}`,
    email: this.email,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);