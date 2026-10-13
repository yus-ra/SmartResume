import { randomBytes } from "node:crypto";

/*
 * Public share-link identifiers.
 *
 * A slug is the ONLY thing standing between an anonymous visitor and someone's
 * portfolio, so it must not be guessable. It is therefore generated from a CSPRNG
 * with 128 bits of entropy and carries no information about the owner:
 *
 *   - not the user id      -> an id is enumerable and leaks account volume
 *   - not the email/name   -> personal data in a URL, and trivially guessable
 *   - not sequential       -> every shared portfolio could be walked in order
 *
 * 16 random bytes encode to 22 URL-safe characters, which is short enough to
 * paste comfortably and far too long to brute force.
 *
 * A slug is server-generated and NEVER accepted from a client. Accepting one
 * would let a caller probe for a collision, or choose something guessable.
 */

const SLUG_BYTES = 16;

/**
 * Shape a slug must have to be worth a database lookup.
 *
 * Applied before querying so a malformed path (a megabyte of `../`, a stray
 * wildcard, an empty string) is rejected cheaply rather than being handed to
 * MongoDB. The upper bound is a sanity limit, not a format requirement.
 */
const SLUG_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

/** Generate a new opaque public slug. */
export const createShareSlug = () =>
  randomBytes(SLUG_BYTES).toString("base64url");

/**
 * True when a value could possibly be a slug this server issued.
 *
 * Purely a filter: a `true` here does not mean the slug exists, only that it is
 * shaped like one and is therefore safe and cheap to look up.
 */
export const isPlausibleSlug = (value) =>
  typeof value === "string" && SLUG_PATTERN.test(value);
