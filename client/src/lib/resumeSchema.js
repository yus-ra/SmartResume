/**
 * client/src/lib/resumeSchema.js
 *
 * ============================================================================
 * THE SINGLE CANONICAL RESUME DATA MODEL FOR SMARTRESUME
 * ============================================================================
 *
 * This module is the only place in the frontend where the SHAPE of a resume is
 * defined, coerced, normalized or persisted. It also owns cloud sync, so no
 * other module performs resume network requests.
 *
 * It deliberately imports no React: components observe sync state through
 * subscribeToResumeSync() so this file stays framework agnostic.
 *
 * Rules for consumers:
 *   - Do NOT define your own resume normalizer or defaults.
 *   - Do NOT read or write resume storage keys directly.
 *   - Do NOT invent placeholder / demo resume content.
 *   Use loadResume(), saveResume() and normalizeResume() from this module.
 *
 * Consumers must use loadResume(), saveResume() and normalizeResume() from this
 * module. The Resume Editor (client/src/pages/ResumeEditor/ResumeEditor.jsx) is
 * wired up. The remaining pages still have their own local normalizers and are
 * being migrated onto this module incrementally; until each one is migrated it
 * remains a second, temporary source of truth.
 *
 * ---------------------------------------------------------------------------
 * CANONICAL SHAPE (schemaVersion 1)
 * ---------------------------------------------------------------------------
 *
 *   {
 *     schemaVersion: 1,
 *     id: string,             // document identity; assigned when created or
                             //   first saved. Empty until then.
 *     documentTitle: string,  // the RESUME DOCUMENT name, e.g. "My Resume"
 *                             //   NOT the job title. That is contact.title.
 *     contact: {
 *       name: string,         // the person's full name
 *       title: string,        // professional / job title
 *       email: string,
 *       phone: string,
 *       location: string,
 *       linkedin: string,
 *       github: string,
 *     },
 *     summary: string,
 *     experience: [
 *       { id: string, role: string, company: string, period: string,
 *         bullets: string[] }
 *     ],
 *     education: [
 *       { id: string, degree: string, school: string, period: string,
 *         field: string }
 *     ],
 *     skills: string[],
 *   }
 *
 * ---------------------------------------------------------------------------
 * THE TWO TITLE FIELDS — DO NOT CONFUSE THEM
 * ---------------------------------------------------------------------------
 *
 *   documentTitle  ->  the name of this resume document  ->  "My Resume"
 *   contact.title  ->  the holder's professional title   ->  "Software Engineer"
 *
 * The legacy resume schema (see client/src/context/ResumeContext.jsx) used the
 * bare root-level key `title` to mean the DOCUMENT name, and it had no field at
 * all for the professional job title.
 *
 * Backward compatibility, enforced by normalizeResume():
 *   - root `documentTitle` is read as `documentTitle`
 *   - root legacy `title` is read as `documentTitle` ONLY as a fallback
 *   - `contact.title` is NEVER populated from the root `title`
 *   - `contact.title` is never renamed and always means the job title
 *
 * So a stored record such as
 *     { title: "My Resume", contact: { title: "Software Engineer" } }
 * loads as
 *     { documentTitle: "My Resume", contact: { title: "Software Engineer" } }
 *
 * ---------------------------------------------------------------------------
 * DATA-SAFETY GUARANTEES
 * ---------------------------------------------------------------------------
 *
 *   1. normalizeResume() NEVER returns demo / fake / placeholder content.
 *      Unusable input yields a blank canonical resume, never sample data.
 *   2. loadResume() NEVER writes. Reading is strictly side-effect free, so a
 *      migration can never destroy stored data as a side effect of rendering.
 *   3. Unknown / extra fields are PRESERVED at the root, on contact, and on
 *      every experience and education entry. Nothing is discarded merely
 *      because it is not listed in the canonical shape above.
 *   4. contact.github is preserved.
 *   5. education[].field is preserved.
 *   6. Existing ids are preserved; numeric ids are widened to strings so that
 *      key comparisons behave consistently across consumers.
 *   7. Missing or unusable ids are handled safely. Experience and education
 *      ENTRIES always receive a unique id, because consumers target them by id
 *      and use them as React keys. The DOCUMENT id is only ever assigned when
 *      the document is created or first saved — never invented on read, so a
 *      stored document keeps one stable identity across page loads.
 *   8. Legacy `personalInfo` data is recovered into contact + summary instead
 *      of being silently blanked.
 *   9. Legacy root-level `title` is recovered into `documentTitle`.
 *  10. A corrupt or non-object primary record does NOT mask a valid legacy
 *      record: the read falls through to the next key.
 *  11. normalizeResume() NEVER throws, for any input whatsoever, including
 *      null, undefined, numbers, arrays, malformed JSON strings and objects
 *      with entirely wrong field types.
 *
 * ---------------------------------------------------------------------------
 * STORAGE
 * ---------------------------------------------------------------------------
 *
 *   resumeData  ->  CANONICAL. The single source of truth.
 *   cvData      ->  LEGACY COMPATIBILITY MIRROR.
 *
 * saveResume() writes byte-identical canonical content to both keys. The legacy
 * key exists only so that a browser tab still running older code keeps working
 * while users transition. It is never an independent schema and is never read
 * as an authority over resumeData — it is only consulted when the canonical
 * key is absent, unparseable or not a JSON object.
 *
 * No key is ever deleted by this module.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS MODULE DELIBERATELY DOES NOT DO
 * ---------------------------------------------------------------------------
 *
 *   - It does not rename or restructure `period`. It stays free text
 *     (e.g. "2022 - Present") because every stored record and every existing
 *     consumer depends on that shape.
 *   - It does not invent fields that exist nowhere in the codebase.
 *   - It does not parse documents. File parsing lives in the import page.
 *   - It does not manage React state or hold a store.
 */

// Explicit extension so this module also loads under plain Node (ESM), which
// keeps it testable outside the Vite bundler.
import { getResume, putResume } from "./api.js";

export const RESUME_SCHEMA_VERSION = 1;

/** Canonical storage key. Single source of truth. */
export const RESUME_STORAGE_KEY = "resumeData";

/**
 * When this device last saved the resume, as an epoch milliseconds string.
 *
 * This is the local half of the last-write-wins tie-breaker. It exists so a
 * cloud copy can never silently overwrite newer work that was done offline,
 * because `updatedAt` is server time and the canonical resume schema carries
 * no timestamp of its own.
 *
 * It is resume metadata, not resume content: the resume shape is unaffected,
 * and `loadResume()` still returns exactly the same canonical object.
 */
export const RESUME_LOCAL_TIMESTAMP_KEY = "smartresume_local_updated_at";

/**
 * Legacy keys written as byte-identical mirrors of the canonical payload.
 * Read only as a fallback when the canonical key is unusable.
 * Not deleted in this phase.
 */
export const RESUME_LEGACY_STORAGE_KEYS = ["cvData"];

/* ======================================================================== *
 * USER SCOPING
 *
 * Resume storage must never be shared between accounts. These keys used to be
 * browser-global, which meant that signing out of User A and signing in as
 * User B on the same browser exposed A's resume to B — and, worse, could push
 * A's resume into B's cloud record.
 *
 * Every key below is therefore derived from the ACTIVE SCOPE:
 *
 *   anonymous        resumeData / cvData / smartresume_local_updated_at
 *   authenticated    resumeData:u<id> / cvData:u<id> / smartresume_local_updated_at:u<id>
 *
 * The anonymous scope deliberately keeps the original un-suffixed names,
 * because that is where pre-authentication work legitimately belongs. Those
 * names stop being usable for resume data the moment an authenticated scope is
 * established: runLegacyMigrationIfNeeded() quarantines them so no account can
 * inherit them (see MIGRATION below).
 *
 * Consumers are unaffected: loadResume() and saveResume() take no scope
 * argument. The scope is set once by AuthContext.
 * ======================================================================== */

const ANONYMOUS_SCOPE = null;

/** Marker recording that the legacy global keys have been quarantined. */
const MIGRATION_MARKER_KEY = "smartresume_resume_migration_v1";

/** Namespace the legacy global keys are moved into. Never assigned to a user. */
const LEGACY_QUARANTINE_SCOPE = "legacy-migrated";

/** The user id whose storage is currently active, or null when anonymous. */
let activeUserId = ANONYMOUS_SCOPE;

/**
 * Scope of the copy most recently read or written by loadResume/saveResume.
 * Used to refuse pushing a resume that was loaded under a different account.
 */
let resumeOriginScope = ANONYMOUS_SCOPE;

const normalizeScopeId = (userId) => {
  if (userId === null || userId === undefined) return null;

  const id = String(userId).trim();

  return id.length > 0 ? id : null;
};

/** The active user id, or null when no account is signed in. */
export const getResumeScope = () => activeUserId;

/** True only when a real account is signed in. */
export const isAuthenticatedResumeScope = () => activeUserId !== null;

/**
 * Point resume storage at an account.
 *
 * `null` (or an empty value) selects the anonymous scope. Switching scope does
 * NOT delete anything: each account's data stays at its own keys and becomes
 * visible again when that account signs back in.
 *
 * Returns the scope that was active before the call.
 */
export const setResumeScope = (userId) => {
  const previous = activeUserId;

  activeUserId = normalizeScopeId(userId);

  if (previous !== activeUserId) {
    /*
     * Sync state is in-memory and would otherwise survive an account change,
     * letting a newly signed-in user see the previous account's "last synced"
     * time and status. Reset it whenever the scope actually changes.
     */
    resumeOriginScope = ANONYMOUS_SCOPE;
    resetResumeSyncState();
  }

  if (isAuthenticatedResumeScope()) {
    runLegacyMigrationIfNeeded();
  }

  return previous;
};

/** Resolve every storage key for a scope. */
const keysForScope = (userId) => {
  const id = normalizeScopeId(userId);

  if (id === null) {
    return {
      scope: ANONYMOUS_SCOPE,
      canonical: RESUME_STORAGE_KEY,
      legacy: [...RESUME_LEGACY_STORAGE_KEYS],
      timestamp: RESUME_LOCAL_TIMESTAMP_KEY,
    };
  }

  // `u` prefix guarantees a user namespace can never collide with the
  // anonymous or quarantined namespaces.
  const namespace = `u${id}`;

  return {
    scope: id,
    canonical: `${RESUME_STORAGE_KEY}:${namespace}`,
    legacy: RESUME_LEGACY_STORAGE_KEYS.map((key) => `${key}:${namespace}`),
    timestamp: `${RESUME_LOCAL_TIMESTAMP_KEY}:${namespace}`,
  };
};

/** Keys for the currently active scope. */
const activeKeys = () => keysForScope(activeUserId);

/* ------------------------------------------------------------------ *
 * Legacy global key migration (runs at most once)
 * ------------------------------------------------------------------ */

/*
 * The unscoped keys hold whatever was saved before accounts existed, or before
 * this fix. There is no owner recorded inside a resume — the canonical schema
 * has no user field — and the old `smartresume_user` cache is not ownership
 * evidence: it is unauthenticated, editable, and pre-dates real accounts
 * entirely. So ownership cannot be established safely.
 *
 * Rather than guess, the legacy payload is MOVED into an isolated namespace
 * that no account reads. It is preserved for a future explicit "claim this
 * resume" flow, and no user can inherit it by accident.
 *
 * Runs at most once, guarded by MIGRATION_MARKER_KEY.
 */
const runLegacyMigrationIfNeeded = () => {
  const storage = getStorage();

  if (!storage) return;

  try {
    if (storage.getItem(MIGRATION_MARKER_KEY)) {
      return;
    }

    const legacyRaw = storage.getItem(RESUME_STORAGE_KEY);

    if (!legacyRaw) {
      // Nothing to quarantine. Mark it done so this is never scanned again.
      storage.setItem(MIGRATION_MARKER_KEY, "none");

      return;
    }

    const quarantine = keysForScope(LEGACY_QUARANTINE_SCOPE);
    const legacyTimestamp = storage.getItem(RESUME_LOCAL_TIMESTAMP_KEY);

    // Never clobber an existing quarantined copy.
    if (storage.getItem(quarantine.canonical) === null) {
      storage.setItem(quarantine.canonical, legacyRaw);

      for (let index = 0; index < RESUME_LEGACY_STORAGE_KEYS.length; index += 1) {
        const value = storage.getItem(RESUME_LEGACY_STORAGE_KEYS[index]);

        if (value !== null && storage.getItem(quarantine.legacy[index]) === null) {
          storage.setItem(quarantine.legacy[index], value);
        }
      }

      // The timestamp belongs to the payload it describes, so it moves too.
      if (legacyTimestamp !== null) {
        storage.setItem(quarantine.timestamp, legacyTimestamp);
      }
    }

    // Remove the un-scoped originals so they are no longer readable.
    storage.removeItem(RESUME_STORAGE_KEY);

    for (const key of RESUME_LEGACY_STORAGE_KEYS) {
      storage.removeItem(key);
    }

    storage.removeItem(RESUME_LOCAL_TIMESTAMP_KEY);

    storage.setItem(MIGRATION_MARKER_KEY, "quarantined");
  } catch {
    // A failed migration must never block sign-in. Leaving the legacy keys in
    // place is the safe outcome: they stay owned by the anonymous scope and
    // are still never shown to an authenticated account.
  }
};

/**
 * Read-only view of the quarantined pre-authentication resume.
 * Exposed so a future explicit "claim" flow can offer it deliberately.
 */
export const getQuarantinedLegacyResume = () => {
  const storage = getStorage();

  if (!storage) return null;

  try {
    const raw = storage.getItem(keysForScope(LEGACY_QUARANTINE_SCOPE).canonical);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") return null;

    return normalizeResume(parsed);
  } catch {
    return null;
  }
};

/** Canonical contact fields, in canonical order. */
export const CONTACT_FIELDS = [
  "name",
  "title",
  "email",
  "phone",
  "location",
  "linkedin",
  "github",
];

/** Canonical experience fields, excluding `id`. */
export const EXPERIENCE_FIELDS = ["role", "company", "period", "bullets"];

/** Canonical education fields, excluding `id`. */
export const EDUCATION_FIELDS = ["degree", "school", "period", "field"];

/**
 * Root keys that this module owns. Anything else found on an input object is
 * treated as an unknown field and preserved verbatim.
 */
const ROOT_CANONICAL_FIELDS = [
  "schemaVersion",
  "id",
  "documentTitle",
  "title",
  "contact",
  "summary",
  "experience",
  "education",
  "skills",
  "personalInfo",
];

/**
 * Legacy `personalInfo` keys that map one-to-one onto a canonical contact
 * field. The person's name is handled separately because the legacy schema
 * split it across `firstName` and `surname`.
 */
const LEGACY_CONTACT_PASSTHROUGH = [
  "email",
  "phone",
  "location",
  "linkedin",
  "github",
];

/* ======================================================================== *
 * Low-level helpers
 * ======================================================================== */

/**
 * True only for non-null, non-array objects. Arrays, null and primitives are
 * rejected so that a malformed value can never be spread into the result.
 */
const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Coerce a value to a trimmed string. Only strings and finite numbers are
 * considered meaningful; everything else (booleans, objects, arrays, symbols,
 * functions, null, undefined) becomes an empty string. This keeps accidental
 * values such as `true` from being written into a resume as the text "true".
 */
const toText = (value) => {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
};

/**
 * Coerce a value to an array of trimmed, non-empty strings. Non-arrays and
 * null entries are skipped rather than throwing.
 */
const toTextArray = (value) => {
  if (!Array.isArray(value)) return [];

  return value.map(toText).filter(Boolean);
};

/**
 * Returns a safe localStorage handle, or null when storage is unavailable
 * (server-side rendering, disabled cookies, some private-browsing modes).
 * Reading the `localStorage` property itself can throw, hence the guard.
 */
const getStorage = () => {
  try {
    if (typeof window === "undefined") return null;

    return window.localStorage || null;
  } catch {
    return null;
  }
};

/* ======================================================================== *
 * Id generation
 * ======================================================================== */

let idSequence = 0;

/**
 * Monotonic fallback used only when the Web Crypto API is unavailable.
 * The sequence counter guarantees uniqueness within a running session even if
 * two ids are minted inside the same millisecond.
 */
const createFallbackId = () => {
  idSequence += 1;

  return `sr-${Date.now().toString(36)}-${idSequence.toString(36)}`;
};

/**
 * Create a unique id.
 *
 * crypto.randomUUID() only exists in secure contexts (https or localhost), so
 * it is feature-detected and guarded. Calling it unguarded on a plain-http
 * origin throws, which previously could break module import.
 */
export const createId = () => {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
  } catch {
    // Feature detection failed; fall through to the local fallback.
  }

  return createFallbackId();
};

/**
 * Read an existing id without inventing one.
 *
 * Used for the resume DOCUMENT id. A document that has never been saved has no
 * identity yet, and it must not acquire a different one on every read: load is
 * side-effect free by design, so a minted id could never be persisted and the
 * document would look like a different document on every page load. Document
 * identity is therefore assigned when the document is created or first saved
 * (see createEmptyResume and saveResume), not on read.
 *
 * Numeric ids are widened to strings so that equality checks behave the same
 * way for every consumer regardless of what produced the record.
 */
const readExistingId = (value) => {
  if (typeof value === "string" && value.trim() !== "") return value;

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
};

/**
 * Preserve an existing id when usable, otherwise mint a new one.
 *
 * Used for experience and education ENTRIES, which always require an identity
 * because consumers target them by id and use them as React keys.
 */
const normalizeEntryId = (value) => readExistingId(value) || createId();

/* ======================================================================== *
 * Canonical sub-normalizers
 * ======================================================================== */

/**
 * Normalize a contact object. All canonical contact fields are always present
 * and always strings. Unknown contact fields are preserved verbatim.
 */
export const normalizeContact = (input) => {
  const source = isPlainObject(input) ? input : {};

  const contact = {};

  CONTACT_FIELDS.forEach((field) => {
    contact[field] = toText(source[field]);
  });

  Object.keys(source).forEach((key) => {
    if (!CONTACT_FIELDS.includes(key)) {
      contact[key] = source[key];
    }
  });

  return contact;
};

/**
 * Normalize one experience entry. Unknown entry fields are preserved verbatim
 * so that data written by a newer version is never dropped by an older one.
 */
export const normalizeExperienceEntry = (input) => {
  const source = isPlainObject(input) ? input : {};

  const entry = {
    id: normalizeEntryId(source.id),
    role: toText(source.role),
    company: toText(source.company),
    period: toText(source.period),
    bullets: toTextArray(source.bullets),
  };

  Object.keys(source).forEach((key) => {
    if (key !== "id" && !EXPERIENCE_FIELDS.includes(key)) {
      entry[key] = source[key];
    }
  });

  return entry;
};

/**
 * Normalize one education entry. `field` is canonical; unknown entry fields are
 * preserved verbatim.
 */
export const normalizeEducationEntry = (input) => {
  const source = isPlainObject(input) ? input : {};

  const entry = {
    id: normalizeEntryId(source.id),
    degree: toText(source.degree),
    school: toText(source.school),
    period: toText(source.period),
    field: toText(source.field),
  };

  Object.keys(source).forEach((key) => {
    if (key !== "id" && !EDUCATION_FIELDS.includes(key)) {
      entry[key] = source[key];
    }
  });

  return entry;
};

/** Normalize a list of experience entries, dropping non-object members. */
const normalizeExperienceList = (input) => {
  if (!Array.isArray(input)) return [];

  return input.filter(isPlainObject).map(normalizeExperienceEntry);
};

/** Normalize a list of education entries, dropping non-object members. */
const normalizeEducationList = (input) => {
  if (!Array.isArray(input)) return [];

  return input.filter(isPlainObject).map(normalizeEducationEntry);
};

/** Normalize the skills list. Order is preserved; empty entries are dropped. */
export const normalizeSkills = (input) => toTextArray(input);

/* ======================================================================== *
 * Legacy shape recovery
 * ======================================================================== */

/**
 * Read the legacy `personalInfo` block, if present, into canonical pieces.
 *
 * The legacy schema stored the person's name split across `firstName` and
 * `surname`, and stored the summary at `personalInfo.summary` instead of at the
 * top level. Neither location is produced by the canonical writer, so both are
 * recovered here rather than being silently blanked.
 */
const readLegacyPersonalInfo = (source) => {
  if (!isPlainObject(source.personalInfo)) {
    return { contact: {}, summary: "" };
  }

  const personalInfo = source.personalInfo;
  const contact = {};

  const fullName = toText(
    [toText(personalInfo.firstName), toText(personalInfo.surname)]
      .filter(Boolean)
      .join(" "),
  );

  if (fullName) {
    contact.name = fullName;
  }

  LEGACY_CONTACT_PASSTHROUGH.forEach((field) => {
    const value = toText(personalInfo[field]);

    if (value) {
      contact[field] = value;
    }
  });

  return { contact, summary: toText(personalInfo.summary) };
};

/**
 * Merge recovered legacy contact values underneath the canonical contact
 * object. An explicitly present canonical key always wins, including when its
 * value is an empty string, so an intentional blank is never overwritten by a
 * legacy value.
 */
const mergeLegacyContact = (legacyContact, contact) => {
  if (!isPlainObject(contact)) return { ...legacyContact };

  return { ...legacyContact, ...contact };
};

/**
 * Resolve the resume document name.
 *
 * `documentTitle` is authoritative. A root-level legacy `title` is used only
 * when `documentTitle` is absent, because in the legacy schema that key meant
 * the document name and never the job title.
 */
const readDocumentTitle = (source) => {
  const canonical = toText(source.documentTitle);

  if (canonical) return canonical;

  return toText(source.title);
};

/* ======================================================================== *
 * Input extraction
 * ======================================================================== */

/**
 * Coerce arbitrary input into a plain object.
 *
 * Accepts an object, or a JSON string containing an object. Anything else —
 * including arrays, numbers, booleans, `null`, `undefined` and malformed JSON —
 * becomes an empty object. Arrays are deliberately NOT treated as a list of
 * resumes to pick from: guessing which entry was "current" would invent data.
 */
const extractResumeObject = (data) => {
  if (isPlainObject(data)) return data;

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);

      return isPlainObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
};

/**
 * Copy any unknown root-level fields from the source onto the canonical result.
 */
const preserveUnknownRootFields = (resume, source) => {
  Object.keys(source).forEach((key) => {
    if (!ROOT_CANONICAL_FIELDS.includes(key)) {
      resume[key] = source[key];
    }
  });

  return resume;
};

/* ======================================================================== *
 * Public normalizer
 * ======================================================================== */

/**
 * Convert any input into a complete canonical resume.
 *
 * This is THE normalizer. It never throws and never returns placeholder data.
 * Unknown fields are preserved at every level.
 */
export const normalizeResume = (data) => {
  const source = extractResumeObject(data);
  const legacy = readLegacyPersonalInfo(source);

  const resume = {
    schemaVersion: RESUME_SCHEMA_VERSION,
    id: readExistingId(source.id),
    documentTitle: readDocumentTitle(source),
    contact: normalizeContact(mergeLegacyContact(legacy.contact, source.contact)),
    summary: toText(source.summary) || legacy.summary,
    experience: normalizeExperienceList(source.experience),
    education: normalizeEducationList(source.education),
    skills: normalizeSkills(source.skills),
  };

  return preserveUnknownRootFields(resume, source);
};

/**
 * Build a blank canonical resume. This is the only supported way to create
 * empty content — there is deliberately no demo/fixture variant.
 */
export const createEmptyResume = (documentTitle = "") => ({
  schemaVersion: RESUME_SCHEMA_VERSION,
  id: createId(),
  documentTitle: toText(documentTitle),
  contact: normalizeContact({}),
  summary: "",
  experience: [],
  education: [],
  skills: [],
});

/**
 * True when the resume carries no user-entered content in any section.
 * Used for honest empty states instead of showing fabricated content.
 */
export const isEmptyResume = (resume) => {
  if (!isPlainObject(resume)) return true;

  const contact = isPlainObject(resume.contact) ? resume.contact : {};

  const hasContact = CONTACT_FIELDS.some(
    (field) => toText(contact[field]) !== "",
  );
  const hasSummary = toText(resume.summary) !== "";
  const hasExperience =
    Array.isArray(resume.experience) && resume.experience.length > 0;
  const hasEducation =
    Array.isArray(resume.education) && resume.education.length > 0;
  const hasSkills = Array.isArray(resume.skills) && resume.skills.length > 0;

  return !(
    hasContact ||
    hasSummary ||
    hasExperience ||
    hasEducation ||
    hasSkills
  );
};

/* ======================================================================== *
 * Storage
 * ======================================================================== */

/**
 * Load the canonical resume.
 *
 * Strictly read-only: this function never writes, never migrates on disk and
 * never deletes a key. Normalization happens in memory only, so the stored
 * bytes are upgraded by the next explicit save rather than by opening a page.
 *
 * Reads the canonical key first. Only if that key is absent, unparseable or not
 * a JSON object does it fall through to the legacy keys, which means a corrupt
 * primary record can never mask a valid legacy record.
 *
 * Always returns a canonical resume. Never throws.
 */
export const loadResume = () => {
  const storage = getStorage();

  const scoped = activeKeys();

  if (!storage) {
    resumeOriginScope = scoped.scope;

    return createEmptyResume();
  }

  // Read only the ACTIVE scope's keys. Switching accounts therefore switches
  // which bytes are visible, without deleting anything.
  const keys = [scoped.canonical, ...scoped.legacy];

  for (const key of keys) {
    let raw;

    try {
      raw = storage.getItem(key);
    } catch {
      continue;
    }

    if (typeof raw !== "string" || raw.trim() === "") continue;

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    if (!isPlainObject(parsed)) continue;

    // Remember which account this copy belongs to, so a later push cannot
    // send it to a different account's server record.
    resumeOriginScope = scoped.scope;

    return normalizeResume(parsed);
  }

  resumeOriginScope = scoped.scope;

  return createEmptyResume();
};

/**
 * Persist a resume.
 *
 * Document identity is assigned here when the document does not have one yet,
 * which is the first moment it can actually be persisted. The returned
 * `resume` is the canonical object that was written, so callers must use it
 * rather than their input if they need the identity.
 *
 * The canonical key is written first and is the only write whose failure is
 * reported as an error. The legacy mirror is best-effort: a failure there must
 * not make an otherwise successful save look broken.
 *
 * Returns `{ ok, resume, error }`. Callers must check `ok` — a failed write is
 * otherwise invisible to the user.
 */
export const saveResume = (resume) => {
  const normalized = normalizeResume(resume);
  const canonical =
    normalized.id === "" ? { ...normalized, id: createId() } : normalized;
  const payload = JSON.stringify(canonical);
  const storage = getStorage();
  const scoped = activeKeys();

  if (!storage) {
    return {
      ok: false,
      resume: canonical,
      error: new Error("Local storage is unavailable."),
    };
  }

  try {
    storage.setItem(scoped.canonical, payload);
  } catch (error) {
    return { ok: false, resume: canonical, error };
  }

  for (const key of scoped.legacy) {
    try {
      storage.setItem(key, payload);
    } catch {
      // Best-effort mirror only; the canonical write already succeeded.
    }
  }

  // Record when THIS account last saved on this device, so a later cloud pull
  // compares this account's local time against this account's server time.
  writeLocalUpdatedAt(Date.now());

  resumeOriginScope = scoped.scope;

  return { ok: true, resume: canonical, error: null };
};

/* ======================================================================== *
 * Cloud sync
 *
 * Local storage is the immediate source of truth. Every UI surface reads from
 * it, and the network is only ever a background mirror:
 *
 *   save local first  ->  mirror to the server, fire and forget
 *   sign in           ->  pull the server copy down in the background
 *
 * Because of that ordering, a save NEVER fails because the network failed. A
 * failed mirror is reported through sync state and retried by the next save.
 *
 * Conflict policy: last write wins. The server copy replaces the local copy on
 * a successful pull. There is deliberately no merge UI.
 *
 * This module stays framework agnostic — it imports no React — so components
 * observe sync state through subscribeToResumeSync() instead.
 * ======================================================================== */

const SYNC_STATUS_IDLE = "idle";
const SYNC_STATUS_SYNCING = "syncing";
const SYNC_STATUS_SYNCED = "synced";
const SYNC_STATUS_OFFLINE = "offline";
const SYNC_STATUS_ERROR = "error";

let syncState = {
  status: SYNC_STATUS_IDLE,
  lastSyncedAt: null,
  lastError: null,
};

const syncListeners = new Set();

/** Current sync state. Returns a copy so callers cannot mutate it. */
export const getResumeSyncState = () => ({ ...syncState });

/**
 * Observe sync state changes.
 * Returns an unsubscribe function.
 */
export const subscribeToResumeSync = (listener) => {
  if (typeof listener !== "function") {
    return () => {};
  }

  syncListeners.add(listener);

  return () => {
    syncListeners.delete(listener);
  };
};

const setSyncState = (patch) => {
  syncState = { ...syncState, ...patch };

  for (const listener of syncListeners) {
    try {
      listener(getResumeSyncState());
    } catch {
      // A misbehaving subscriber must not break sync for everyone else.
    }
  }
};

const nowIso = () => new Date().toISOString();

/* ------------------------------------------------------------------ *
 * Local timestamp helpers (last-write-wins tie-breaker)
 * ------------------------------------------------------------------ */

/** Epoch ms of the last local save for the ACTIVE scope, or 0 when none. */
const readLocalUpdatedAt = () => {
  const storage = getStorage();

  if (!storage) return 0;

  try {
    const value = Number(storage.getItem(activeKeys().timestamp));

    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
};

const writeLocalUpdatedAt = (timestamp) => {
  const storage = getStorage();

  if (!storage) return;

  try {
    storage.setItem(activeKeys().timestamp, String(timestamp));
  } catch {
    // Losing the timestamp only weakens the offline guard; it must never
    // prevent the resume itself from being saved.
  }
};

/** Epoch ms for a server ISO timestamp, or 0 when absent/unparseable. */
const serverUpdatedAtMs = (iso) => {
  if (!iso) return 0;

  const parsed = new Date(iso).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Pull the server copy down and store it locally.
 *
 * Called after a session is confirmed. Never throws.
 *
 * Resolution, so a stale cloud copy can never silently destroy newer offline
 * work:
 *   local resume empty        -> pull; there is nothing to protect
 *   local timestamp newer     -> keep local, push it up instead of pulling
 *   server newer / no stamp   -> pull and overwrite
 *
 * Result reasons:
 *   "pulled"           server copy was adopted
 *   "local_newer"      local work was kept and pushed instead
 *   "no_server_resume" server has nothing; local data deliberately untouched
 *   "unauthenticated"  no valid session; nothing touched
 *   "offline"          server unreachable/unhealthy; nothing touched
 *   "error"            unexpected failure; nothing touched
 */
export const syncResumeFromServer = async () => {
  // Only an authenticated scope has a server record to pull. The anonymous
  // scope owns the un-scoped keys and must never touch an account.
  if (!isAuthenticatedResumeScope()) {
    return { ok: false, reason: "anonymous_scope", changed: false };
  }

  setSyncState({ status: SYNC_STATUS_SYNCING, lastError: null });

  let result;

  try {
    result = await getResume();
  } catch (error) {
    // api.js is contracted never to throw, so this is belt and braces.
    setSyncState({
      status: SYNC_STATUS_OFFLINE,
      lastError: error?.message || "Could not reach the server.",
    });

    return { ok: false, reason: "offline", changed: false };
  }

  if (result.ok && result.data?.resume) {
    const incoming = normalizeResume(result.data.resume);
    const current = loadResume();

    // Nothing on this device worth protecting, so adopt the cloud copy.
    // This is what restores a resume onto a fresh browser.
    if (isEmptyResume(current)) {
      const saved = saveResume(incoming);

      if (!saved.ok) {
        setSyncState({
          status: SYNC_STATUS_ERROR,
          lastError: saved.error?.message || "Could not write the pulled resume locally.",
        });

        return { ok: false, reason: "error", changed: false };
      }

      // Align the local stamp with the server so the next pull does not
      // mistake this just-restored copy for newer offline work.
      writeLocalUpdatedAt(serverUpdatedAtMs(result.data.updatedAt) || Date.now());

      setSyncState({
        status: SYNC_STATUS_SYNCED,
        lastSyncedAt: nowIso(),
        lastError: null,
      });

      return { ok: true, reason: "pulled", changed: true, resolution: "local_empty" };
    }

    const localUpdatedAt = readLocalUpdatedAt();
    const serverAt = serverUpdatedAtMs(result.data.updatedAt);

    /*
     * The local copy was changed more recently than the server copy, so the
     * server is stale. Keep the local work and push it instead of overwriting.
     */
    if (localUpdatedAt > 0 && localUpdatedAt > serverAt) {
      const pushed = await syncResumeToServer(current);

      return {
        ok: true,
        reason: "local_newer",
        changed: false,
        resolution: "kept_local",
        pushed: pushed.ok,
        localUpdatedAt,
        serverUpdatedAt: serverAt,
      };
    }

    const changed = JSON.stringify(current) !== JSON.stringify(incoming);

    // Written through saveResume() so resumeData and its cvData mirror stay
    // consistent, and so the normalizer runs exactly once per pull.
    const saved = saveResume(incoming);

    if (!saved.ok) {
      setSyncState({
        status: SYNC_STATUS_ERROR,
        lastError: saved.error?.message || "Could not write the pulled resume locally.",
      });

      return { ok: false, reason: "error", changed: false };
    }

    // This copy now matches the server, so record the server's own timestamp
    // rather than the current time.
    writeLocalUpdatedAt(serverAt || Date.now());

    setSyncState({
      status: SYNC_STATUS_SYNCED,
      lastSyncedAt: nowIso(),
      lastError: null,
    });

    return {
      ok: true,
      reason: "pulled",
      changed,
      resolution: localUpdatedAt > 0 ? "server_newer" : "no_local_timestamp",
    };
  }

  // 404 means the account has no server-side resume yet. Local data, if any,
  // must NOT be replaced with nothing.
  if (result.status === 404) {
    setSyncState({
      status: SYNC_STATUS_SYNCED,
      lastSyncedAt: nowIso(),
      lastError: null,
    });

    return { ok: true, reason: "no_server_resume", changed: false };
  }

  if (result.status === 401) {
    setSyncState({
      status: SYNC_STATUS_ERROR,
      lastError: "Your session has expired. Sign in again to sync.",
    });

    return { ok: false, reason: "unauthenticated", changed: false };
  }

  // Unreachable, database down, or any other server-side failure. The local
  // copy remains authoritative and the user keeps working offline.
  setSyncState({
    status: SYNC_STATUS_OFFLINE,
    lastError: result.message || "The server could not be reached.",
  });

  return { ok: false, reason: "offline", changed: false };
};

/**
 * Mirror a resume to the server.
 *
 * Called after a successful local save, in the background. Never throws and
 * never blocks: the caller has already persisted locally.
 */
export const syncResumeToServer = async (resume) => {
  /*
   * Push safety, in order:
   *  1. No account signed in -> there is no record to write to. Refused.
   *  2. The resume being pushed was last read or written under a DIFFERENT
   *     account than the one now signed in. Refused, because sending it would
   *     write one user's resume into another user's cloud record.
   */
  if (!isAuthenticatedResumeScope()) {
    return {
      ok: false,
      reason: "anonymous_scope",
      message: "Sign in before syncing a resume to your account.",
    };
  }

  // Strict equality: a copy loaded while anonymous (origin null) is also
  // refused once an account is active.
  if (resumeOriginScope !== activeUserId) {
    return {
      ok: false,
      reason: "scope_mismatch",
      message:
        "This resume belongs to a different account and was not uploaded.",
    };
  }

  const canonical = normalizeResume(resume);

  setSyncState({ status: SYNC_STATUS_SYNCING, lastError: null });

  try {
    const result = await putResume(
      canonical,
      canonical.schemaVersion ?? RESUME_SCHEMA_VERSION,
    );

    if (result.ok) {
      setSyncState({
        status: SYNC_STATUS_SYNCED,
        lastSyncedAt: nowIso(),
        lastError: null,
      });

      return { ok: true };
    }

    if (result.status === 401) {
      setSyncState({
        status: SYNC_STATUS_ERROR,
        lastError: "Sign in again to sync this resume.",
      });

      return { ok: false, reason: "unauthenticated", message: result.message };
    }

    setSyncState({
      status: SYNC_STATUS_OFFLINE,
      lastError: result.message || "The server could not be reached.",
    });

    return { ok: false, reason: "offline", message: result.message };
  } catch (error) {
    setSyncState({
      status: SYNC_STATUS_OFFLINE,
      lastError: error?.message || "Could not reach the server.",
    });

    return { ok: false, reason: "offline" };
  }
};

/** Reset sync state, e.g. on logout. Local resume data is not touched. */
export const resetResumeSyncState = () => {
  setSyncState({
    status: SYNC_STATUS_IDLE,
    lastSyncedAt: null,
    lastError: null,
  });
};

/* ======================================================================== *
 * Legacy adapters (for client/src/context/ResumeContext.jsx compatibility)
 * ======================================================================== */

/**
 * Convert a canonical resume into the legacy `personalInfo` block.
 *
 * The canonical model stores one `contact.name`; the legacy schema wants it
 * split. The first whitespace-separated token becomes `firstName` and the
 * remainder becomes `surname`, which is the inverse of the reconstruction
 * performed by readLegacyPersonalInfo() for the common single-name and
 * "First Last" cases.
 */
export const toLegacyPersonalInfo = (resume) => {
  const canonical = normalizeResume(resume);

  const nameParts = canonical.contact.name
    ? canonical.contact.name.split(/\s+/).filter(Boolean)
    : [];

  const firstName = nameParts.length > 0 ? nameParts[0] : "";
  const surname = nameParts.slice(1).join(" ");

  return {
    firstName,
    surname,
    email: canonical.contact.email,
    phone: canonical.contact.phone,
    location: canonical.contact.location,
    summary: canonical.summary,
  };
};

/**
 * Convert a canonical resume into a full legacy-schema resume object, matching
 * the shape previously produced by client/src/context/ResumeContext.jsx.
 *
 * Used so that existing consumers of the legacy API keep working without that
 * file having to define a second, competing schema.
 */
export const toLegacyResume = (resume) => {
  const canonical = normalizeResume(resume);

  return {
    id: canonical.id || createId(),
    title: canonical.documentTitle,
    personalInfo: toLegacyPersonalInfo(canonical),
    experience: canonical.experience.map((entry) => ({ ...entry })),
    education: canonical.education.map((entry) => ({ ...entry })),
    skills: [...canonical.skills],
  };
};