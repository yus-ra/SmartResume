/*
 * A small in-memory rate limiter.
 *
 * The public portfolio endpoint is the first route in this server that is
 * unauthenticated, reaches MongoDB, and can be reached by anyone on the
 * internet. Without a limit it is a cheap way to enumerate slugs and to make the
 * server do a database lookup per request.
 *
 * ---------------------------------------------------------------------------
 * SCOPE AND HONEST LIMITATIONS
 * ---------------------------------------------------------------------------
 *
 * Counters live in this process's memory. That is sufficient and correct for the
 * single-instance deployment this project has today, and it adds no dependency.
 * It does NOT hold across:
 *
 *   - multiple instances behind a load balancer (each keeps its own counts), or
 *   - a process restart (counters are lost).
 *
 * Neither matters for the threat being addressed here: a limiter that slows
 * runaway enumeration to a crawl from any single address is the whole point, and
 * an attacker cannot restart the server. If this is ever deployed across
 * instances, the counters must move to Redis or to the reverse proxy.
 *
 * `req.ip` is used, which relies on Express's `trust proxy` setting being
 * correct in production. Left at its default, it is the direct socket address,
 * which is the safe default (it cannot be spoofed by a header).
 */

/** Client buckets, keyed by IP. Entries are dropped once their window passes. */
const buckets = new Map();
let nextLimiterId = 0;

/** How many requests pass before expired buckets are swept. */
const PRUNE_INTERVAL = 500;

/**
 * Build a fixed-window limiter.
 *
 * @param {object} options
 * @param {number} options.windowMs  Length of the window in milliseconds.
 * @param {number} options.max       Requests allowed per window per key.
 * @param {string} options.message   Body message sent with the 429.
 */
export function createRateLimit({ windowMs, max, message }) {
  /** Requests this limiter has handled, used to trigger opportunistic sweeps. */
  let handled = 0;
  const limiterId = nextLimiterId++;

  return function rateLimit(req, res, next) {
    /*
     * Expired buckets are swept here rather than on a timer, so an idle server
     * does no work at all. Without this the map would hold one entry per
     * distinct address forever.
     */
    handled += 1;

    if (handled % PRUNE_INTERVAL === 0) {
      pruneRateLimitBuckets();
    }

    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
    const key = `${limiterId}:${clientIp}`;
    const now = Date.now();

    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });

      return next();
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000),
      );

      res.set("Retry-After", String(retryAfterSeconds));

      return res.status(429).json({
        error: "rate_limited",
        message,
      });
    }

    return next();
  };
}

/**
 * Drop expired buckets.
 *
 * Called opportunistically by the limiter itself rather than on a timer, so an
 * idle server does no work and nothing needs `unref`ing.
 */
export function pruneRateLimitBuckets() {
  const now = Date.now();

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/** Test/debug helper: the number of tracked clients. */
export const rateLimitBucketCount = () => buckets.size;
