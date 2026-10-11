import mongoose from "mongoose";

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
  },
  { timestamps: true }
);

portfolioSchema.methods.toPublicJSON = function () {
  return {
    portfolio: this.data,
    activeTemplate: this.activeTemplate,
    updatedAt: this.updatedAt,
  };
};

const Portfolio = mongoose.model("Portfolio", portfolioSchema);
export default Portfolio;