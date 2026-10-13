/*
 * The public projection of a portfolio.
 *
 * ============================================================================
 * THIS IS A SECURITY BOUNDARY. TREAT IT AS ONE.
 * ============================================================================
 *
 * `Portfolio.data` and `Resume.resume` are both Mixed blobs whose shape is owned
 * by the client. Spreading either of them into a public response would mean
 * that ANY field a future client version happens to write becomes public the
 * moment it is saved — silently, and with no code change here. A phone number
 * added to the resume for the user's own use would appear on a public web page.
 *
 * So this module never spreads. Every field is named, and anything not named is
 * dropped. Adding a field to the public payload therefore has to be a deliberate
 * edit in exactly one place.
 *
 * It is deliberately separate from the controller so the whole public surface
 * can be reviewed by reading a single file.
 */

/* ------------------------------------------------------------------ *
 * Allow-lists
 * ------------------------------------------------------------------ */

/** Profile fields that may be published. `email` is conditional. */
const PUBLIC_PROFILE_FIELDS = ["name", "title", "bio", "linkedin", "github"];

/** Contact-detail fields, published only when the owner allows it. */
const CONTACT_PROFILE_FIELDS = ["email"];

/**
 * Project fields that may be published.
 *
 * `id` is included even though it is not human-meaningful: it is an opaque
 * client-generated string with no personal data, and the renderer uses it as a
 * stable React key.
 */
const PUBLIC_PROJECT_FIELDS = ["id", "title", "desc", "tags", "link"];

/** Resume sections that may be published. Contact details never are. */
const EXPERIENCE_FIELDS = ["role", "company", "period", "bullets"];
const EDUCATION_FIELDS = ["degree", "school", "period"];

/* ------------------------------------------------------------------ *
 * Coercion
 *
 * Mirrors the client's own normalisation (client/src/lib/portfolio.js) so the
 * public page receives the same shapes the builder renders from. A public
 * viewer must never be the reason a field is missing or wrongly typed.
 * ------------------------------------------------------------------ */

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toText = (value) => {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
};

/** Arrays of strings, trimmed, with empty entries dropped. */
const toTextArray = (value) => {
  if (!Array.isArray(value)) return [];

  return value.map(toText).filter(Boolean);
};

/** One object reduced to a named allow-list of string fields. */
const pickTextFields = (source, fields) => {
  const input = isPlainObject(source) ? source : {};

  return fields.reduce((result, field) => {
    result[field] = toText(input[field]);

    return result;
  }, {});
};

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

const projectPublicProject = (project) => ({
  ...pickTextFields(project, PUBLIC_PROJECT_FIELDS),
  tags: toTextArray(isPlainObject(project) ? project.tags : []),
});

const projectPublicProfile = (profile, showContact) => {
  const source = isPlainObject(profile) ? profile : {};

  const result = pickTextFields(source, PUBLIC_PROFILE_FIELDS);

  if (showContact === true) {
    Object.assign(result, pickTextFields(source, CONTACT_PROFILE_FIELDS));
  } else {
    // Present but empty, so the client shape is identical either way and the
    // renderer needs no knowledge of the viewer's permission.
    result.email = "";
  }

  return result;
};

/**
 * Project the experience / education / skills sections of a resume.
 *
 * The resume also holds the owner's name, email, phone and location. NONE of
 * those are reachable from here: only these three sections are read at all.
 */
const projectPublicResume = (resume) => {
  const source = isPlainObject(resume) ? resume : {};

  return {
    experience: (Array.isArray(source.experience) ? source.experience : [])
      .filter(isPlainObject)
      .map((entry) => {
        const projected = pickTextFields(entry, EXPERIENCE_FIELDS);

        projected.bullets = toTextArray(entry.bullets);

        return projected;
      }),

    education: (Array.isArray(source.education) ? source.education : [])
      .filter(isPlainObject)
      .map((entry) => pickTextFields(entry, EDUCATION_FIELDS)),

    skills: toTextArray(source.skills),
  };
};

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

/** Theme ids the client can actually render (client/src/lib/portfolio.js). */
const RENDERABLE_THEME_IDS = [1, 2, 3];
const DEFAULT_THEME_ID = 1;

/**
 * Build the complete public payload for one portfolio.
 *
 * @param {object}   input
 * @param {object}   input.portfolioData  Portfolio.data (client-owned blob)
 * @param {number}   input.activeTemplate Portfolio.activeTemplate (authoritative)
 * @param {object}   input.resume         Resume.resume, or null when the account
 *                                        has never saved one
 * @param {boolean}  input.showContact    Portfolio.share.showContact
 * @param {Date}     input.updatedAt      Portfolio.updatedAt
 *
 * The theme is taken from `activeTemplate`, not from `data.themeId`. Both exist
 * and they can disagree — `activeTemplate` is the typed, dedicated field, so it
 * is the one that wins.
 */
export const projectPublicPortfolio = ({
  portfolioData,
  activeTemplate,
  resume,
  showContact,
  updatedAt,
}) => {
  const source = isPlainObject(portfolioData) ? portfolioData : {};

  return {
    portfolio: {
      profile: projectPublicProfile(source.profile, showContact === true),

      // A project still being typed (no title, no description) is dropped
      // rather than published as an empty card.
      projects: (Array.isArray(source.projects) ? source.projects : [])
        .filter(isPlainObject)
        .map(projectPublicProject)
        .filter((project) => project.title || project.desc),

      themeId: RENDERABLE_THEME_IDS.includes(activeTemplate)
        ? activeTemplate
        : DEFAULT_THEME_ID,
    },

    resume: projectPublicResume(resume),

    updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : null,
  };
};
