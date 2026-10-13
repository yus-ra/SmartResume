import "dotenv/config";
import mongoose from "mongoose";

const INDEX_NAME = "share_slug_unique";
const INDEX_KEY = { "share.slug": 1 };
const INDEX_OPTIONS = {
  unique: true,
  partialFilterExpression: { "share.slug": { $type: "string" } },
  name: INDEX_NAME,
};

const hasExpectedSlugKey = (key) =>
  key &&
  Object.keys(key).length === 1 &&
  key["share.slug"] === 1;

const hasExpectedPartialFilter = (filter) => {
  const slugFilter = filter?.["share.slug"];

  return (
    filter &&
    Object.keys(filter).length === 1 &&
    slugFilter &&
    Object.keys(slugFilter).length === 1 &&
    slugFilter.$type === "string"
  );
};

const isDesiredIndex = (index) =>
  index?.name === INDEX_NAME &&
  hasExpectedSlugKey(index.key) &&
  index.unique === true &&
  index.sparse !== true &&
  hasExpectedPartialFilter(index.partialFilterExpression);

const isNamespaceMissing = (error) =>
  error?.code === 26 || error?.codeName === "NamespaceNotFound";

async function replacePortfolioShareSlugIndex() {
  const mongoUri =
    process.env.MONGODB_URI?.trim() ||
    "mongodb://127.0.0.1:27017/smartresume";

  // Prevent model initialization from racing this explicit index replacement.
  mongoose.set("autoIndex", false);

  const { default: Portfolio } = await import("../src/models/Portfolio.js");

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    let indexes = [];

    try {
      indexes = await Portfolio.collection.indexes();
    } catch (error) {
      if (!isNamespaceMissing(error)) {
        throw error;
      }
    }

    const namedIndex = indexes.find((index) => index.name === INDEX_NAME);

    if (namedIndex && !isDesiredIndex(namedIndex)) {
      if (namedIndex.key?.["share.slug"] !== 1) {
        throw new Error(
          `Index ${INDEX_NAME} exists with an unexpected key; no index was changed.`,
        );
      }
    }

    const otherSlugIndexes = indexes.filter(
      (index) =>
        index.name !== INDEX_NAME &&
        index.key?.["share.slug"] === 1,
    );

    if (otherSlugIndexes.length > 0) {
      throw new Error(
        `Found an unrecognized index on share.slug (${otherSlugIndexes
          .map((index) => index.name)
          .join(", ")}); no index was changed.`,
      );
    }

    if (isDesiredIndex(namedIndex)) {
      console.log("Portfolio share slug index is already up to date.");
      return;
    }

    // Check before dropping the old index. If real string slugs conflict, stop
    // without changing indexes or portfolio documents.
    let duplicates = [];

    try {
      duplicates = await Portfolio.collection
        .aggregate([
          { $match: { "share.slug": { $type: "string" } } },
          { $group: { _id: "$share.slug", count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } },
          { $limit: 1 },
        ])
        .toArray();
    } catch (error) {
      if (!isNamespaceMissing(error)) {
        throw error;
      }
    }

    if (duplicates.length > 0) {
      throw new Error(
        "Duplicate string share slugs exist; no index or portfolio data was changed.",
      );
    }

    if (namedIndex) {
      await Portfolio.collection.dropIndex(INDEX_NAME);
    }

    await Portfolio.collection.createIndex(INDEX_KEY, INDEX_OPTIONS);

    console.log(
      "Replaced the portfolio share slug index. No portfolio documents were changed.",
    );
  } finally {
    await mongoose.disconnect();
  }
}

replacePortfolioShareSlugIndex().catch((error) => {
  console.error("Could not replace the portfolio share slug index:", error.message);
  process.exitCode = 1;
});
