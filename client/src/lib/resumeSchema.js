/**
 * client/src/lib/resumeSchema.js
 *
 * ============================================================================
 * THE SINGLE CANONICAL RESUME DATA MODEL FOR SMARTRESUME
 * ============================================================================
 *
 * This module is the only place in the frontend where the SHAPE of a resume is
 * defined, coerced, normalized or persisted.
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

export const RESUME_SCHEMA_VERSION = 1;

/** Canonical storage key. Single source of truth. */
export const RESUME_STORAGE_KEY = "resumeData";

/**
 * Legacy keys written as byte-identical mirrors of the canonical payload.
 * Read only as a fallback when the canonical key is unusable.
 * Not deleted in this phase.
 */
export const RESUME_LEGACY_STORAGE_KEYS = ["cvData"];

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

  if (!storage) return createEmptyResume();

  const keys = [RESUME_STORAGE_KEY, ...RESUME_LEGACY_STORAGE_KEYS];

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

    return normalizeResume(parsed);
  }

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

  if (!storage) {
    return {
      ok: false,
      resume: canonical,
      error: new Error("Local storage is unavailable."),
    };
  }

  try {
    storage.setItem(RESUME_STORAGE_KEY, payload);
  } catch (error) {
    return { ok: false, resume: canonical, error };
  }

  for (const key of RESUME_LEGACY_STORAGE_KEYS) {
    try {
      storage.setItem(key, payload);
    } catch {
      // Best-effort mirror only; the canonical write already succeeded.
    }
  }

  return { ok: true, resume: canonical, error: null };
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