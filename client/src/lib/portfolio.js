/**
 * client/src/lib/portfolio.js
 *
 * ============================================================================
 * THE SINGLE CANONICAL PORTFOLIO DATA MODEL FOR SMARTRESUME (CLIENT)
 * ============================================================================
 *
 * This module is the only place in the frontend where the SHAPE of a portfolio
 * is defined, coerced and normalised, and the only place that owns the theme
 * tokens and the display helpers that go with them.
 *
 * It is deliberately imported by BOTH surfaces that render a portfolio:
 *
 *   pages/Portfolio/Portfolio.jsx          the authenticated builder
 *   pages/PublicPortfolio/PublicPortfolio  the anonymous public viewer
 *
 * Those two used to be independent renderers, which is exactly how a preview
 * and a published page drift apart. Anything they share lives here.
 *
 * It imports no React and touches no storage, so it is safe to use on the
 * public page, where the viewer has no account and no local data.
 *
 * ---------------------------------------------------------------------------
 * CANONICAL SHAPE
 * ---------------------------------------------------------------------------
 *
 *   {
 *     profile: {
 *       name: string, title: string, bio: string,
 *       email: string, linkedin: string, github: string,
 *     },
 *     projects: [
 *       { id: string, title: string, desc: string, tags: string[], link: string }
 *     ],
 *     themeId: number,
 *   }
 *
 * Experience, education and skills are NOT part of this shape. They belong to
 * the resume (see lib/resumeSchema.js) and are joined to a portfolio at render
 * time. `normalizePublicPortfolio()` below accepts them from the API so a
 * public page can render resume sections it does not own.
 * ============================================================================
 */

/* ------------------------------------------------------------------ *
 * Themes
 * ------------------------------------------------------------------ */

/**
 * Theme tokens. `id` is the value persisted in `Portfolio.activeTemplate`.
 * Order is significant: it is the order shown in the builder.
 */
export const PORTFOLIO_THEMES = [
  {
    id: 1,
    name: "Minimal",
    bg: "#FFFFFF",
    accent: "#2563EB",
    text: "#0F172A",
    muted: "#64748B",
  },
  {
    id: 2,
    name: "Dark",
    bg: "#0F172A",
    accent: "#14B8A6",
    text: "#F8FAFC",
    muted: "#CBD5E1",
  },
  {
    id: 3,
    name: "Warm",
    bg: "#FFFBEB",
    accent: "#F59E0B",
    text: "#451A03",
    muted: "#92400E",
  },
];

/** Theme used whenever the stored id is missing or unrecognised. */
export const DEFAULT_THEME_ID = 1;

/**
 * Resolve a theme id to its tokens.
 *
 * Never returns undefined: an unknown id falls back to the default theme, so a
 * render can never be handed an object with no colours on it.
 */
export const resolveTheme = (themeId) =>
  PORTFOLIO_THEMES.find((theme) => theme.id === themeId) ||
  PORTFOLIO_THEMES[0];

/** True when the id names a theme this app can actually render. */
export const isValidThemeId = (themeId) =>
  PORTFOLIO_THEMES.some((theme) => theme.id === themeId);

/* ------------------------------------------------------------------ *
 * Display helpers
 * ------------------------------------------------------------------ */

const URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Turn a loosely typed value from a user into a safe href.
 *
 * Users type "github.com/me", "me@example.com" or a full URL, and all three
 * appear in the same field. A bare domain gets https://, a bare email address
 * gets mailto:. Anything that already carries a scheme is passed through, EXCEPT
 * `javascript:` and other script-bearing schemes, which would turn a public
 * portfolio into an XSS vector for whoever pasted the link. Those are voided.
 */
export const cleanUrl = (url = "") => {
  const value = String(url).trim();

  if (!value) {
    return "";
  }

  if (URL_SCHEME_PATTERN.test(value)) {
    // Only real navigation schemes may pass through. `javascript:`, `data:`
    // and `vbscript:` are rejected outright rather than sanitised.
    const scheme = value.slice(0, value.indexOf(":")).toLowerCase();

    return scheme === "http" || scheme === "https" || scheme === "mailto"
      ? value
      : "";
  }

  if (value.includes("@") && !value.includes("/")) {
    return `mailto:${value}`;
  }

  return `https://${value}`;
};

/**
 * Initials for the avatar tile.
 * Falls back to a neutral "SR" rather than an empty tile.
 */
export const getInitials = (name = "") => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "SR";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

/* ------------------------------------------------------------------ *
 * Low-level coercion
 * ------------------------------------------------------------------ */

/**
 * True only for non-null, non-array objects. Arrays, null and primitives are
 * rejected so a malformed value can never be spread into the result.
 */
export const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Coerce to a trimmed string. Numbers are accepted; everything else is "". */
const toText = (value) => {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
};

/** Coerce to an array of non-empty trimmed strings. */
const toTextArray = (value) => {
  if (!Array.isArray(value)) return [];

  return value.map(toText).filter(Boolean);
};

/* ------------------------------------------------------------------ *
 * Canonical shape
 * ------------------------------------------------------------------ */

/** Profile keys the app renders, in display order. */
export const PROFILE_FIELDS = [
  "name",
  "title",
  "bio",
  "email",
  "linkedin",
  "github",
];

const createEmptyProfile = () =>
  PROFILE_FIELDS.reduce((profile, field) => {
    profile[field] = "";

    return profile;
  }, {});

/**
 * A project id.
 *
 * Projects are identified by a stable id so React keys and per-project updates
 * behave. Nothing persists this id in a meaningful way, so a random string is
 * sufficient and avoids the collision risk of a Date.now()-based value.
 */
let projectSequence = 0;

const createProjectId = () => {
  projectSequence += 1;

  return `p-${Date.now().toString(36)}-${projectSequence.toString(36)}`;
};

/** A blank project, ready to be edited. */
export const createDefaultProject = () => ({
  id: createProjectId(),
  title: "",
  desc: "",
  tags: [],
  link: "",
});

/** A blank portfolio. The only supported way to create empty content. */
export const createDefaultPortfolio = () => ({
  profile: createEmptyProfile(),
  projects: [],
  themeId: DEFAULT_THEME_ID,
});

/** Normalise one project. Unknown fields are dropped: this shape is closed. */
const normalizeProject = (input) => {
  const source = isPlainObject(input) ? input : {};

  return {
    id: toText(source.id) || createProjectId(),
    title: toText(source.title),
    desc: toText(source.desc),
    tags: toTextArray(source.tags),
    link: toText(source.link),
  };
};

/**
 * Normalise a portfolio into a complete canonical object.
 *
 * Never throws, for any input whatsoever. Missing and wrongly typed fields are
 * replaced with empty values rather than being passed through as undefined, so
 * a render can never be handed `undefined` where it expects a string.
 */
export const normalizePortfolio = (input) => {
  const source = isPlainObject(input) ? input : {};
  const profileSource = isPlainObject(source.profile) ? source.profile : {};

  const profile = PROFILE_FIELDS.reduce((result, field) => {
    result[field] = toText(profileSource[field]);

    return result;
  }, {});

  return {
    profile,
    projects: Array.isArray(source.projects)
      ? source.projects.map(normalizeProject)
      : [],
    themeId: isValidThemeId(source.themeId) ? source.themeId : DEFAULT_THEME_ID,
  };
};

/* ------------------------------------------------------------------ *
 * Public (read-only) payload
 * ------------------------------------------------------------------ */

/** Resume facts a public portfolio may render. Never contact details. */
const PUBLIC_RESUME_SECTIONS = ["experience", "education", "skills"];

/**
 * Normalise the payload returned by `GET /api/public/portfolios/:slug`.
 *
 * The server already projects an allow-list, but this runs the same client-side
 * coercion as the builder so both surfaces render identically from identical
 * input, and a malformed or partial response degrades to empty sections rather
 * than crashing the page.
 *
 * Returns `{ portfolio, resume, updatedAt }`.
 */
export const normalizePublicPortfolio = (payload) => {
  const source = isPlainObject(payload) ? payload : {};
  const resumeSource = isPlainObject(source.resume) ? source.resume : {};

  const resume = PUBLIC_RESUME_SECTIONS.reduce((result, section) => {
    result[section] = Array.isArray(resumeSource[section])
      ? resumeSource[section]
      : [];

    // Skills is the one section that is a list of strings, not objects.
    if (section === "skills") {
      result[section] = toTextArray(resumeSource[section]);
    }

    return result;
  }, {});

  return {
    portfolio: normalizePortfolio(source.portfolio),
    resume,
    updatedAt: toText(source.updatedAt) || null,
  };
};
