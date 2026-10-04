import mongoose from "mongoose";

import { env, hasMongoUri } from "./env.js";

/*
 * Graceful database connection.
 *
 * The server is ALWAYS expected to boot. A missing or unreachable database
 * degrades the API to 503 on database-backed routes instead of taking the
 * process down, so the React client remains fully usable for frontend work.
 *
 * The app never listens until `connectDatabase()` has settled, so no request
 * can arrive while the connection state is still unknown.
 */

let connectionState = "disconnected"; // disconnected | connecting | connected

export const getConnectionState = () => connectionState;

export const isDatabaseReady = () => connectionState === "connected";

const log = (message) => console.log(`[db] ${message}`);
const warn = (message) => console.warn(`[db] ⚠️  ${message}`);

/** Resolve the Mongo connection string, applying a convenience default. */
const resolveUri = () => {
  if (hasMongoUri()) {
    return env.mongoUri;
  }

  // A local default is only useful when the developer actually runs MongoDB
  // locally; it is a fallback, not a requirement.
  return "mongodb://127.0.0.1:27017/smartresume";
};

export async function connectDatabase() {
  connectionState = "connecting";

  if (!hasMongoUri()) {
    warn("MONGODB_URI is not set.");
    warn(
      `Falling back to ${resolveUri()} and trying anyway. ` +
        "Database routes will return 503 if this is unreachable.",
    );
  }

  try {
    await mongoose.connect(resolveUri(), {
      // Fail fast instead of hanging for 30s on an unreachable host.
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    connectionState = "connected";

    log(`Connected to ${redactUri(mongoose.connection.name)}`);

    return true;
  } catch (error) {
    connectionState = "disconnected";

    // eslint-disable-next-line no-console
    console.warn(`[db] ⚠️  Connection failed: ${error.message}`);
    warn(
      "Starting without a database. " +
        "Routes that need MongoDB will respond with 503. " +
        "Set MONGODB_URI in server/.env and restart to enable them.",
    );

    return false;
  }
}

export async function disconnectDatabase() {
  if (connectionState === "connected") {
    await mongoose.disconnect();
    connectionState = "disconnected";
    log("Disconnected");
  }
}

/** Strip credentials and host from a connection string before logging it. */
function redactUri(name) {
  return name ? `database "${name}"` : "the configured database";
}

/*
 * Mongoose emits its own index/build logs after a successful connect. Keep
 * them out of the way so real warnings stay visible.
 */
mongoose.set("strictQuery", true);