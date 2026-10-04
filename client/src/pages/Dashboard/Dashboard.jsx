import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Sparkles,
  Globe,
  Target,
  Briefcase,
  GraduationCap,
  Wrench,
  CheckCircle2,
  ArrowUpRight,
  ChevronRight,
  Upload,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import Sidebar from "../../components/Navbar/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  getResumeSyncState,
  loadResume,
  isEmptyResume,
  subscribeToResumeSync,
} from "../../lib/resumeSchema";

/* =========================================================
   QUICK ACTIONS

   Job Match used to live inside the header button row as a
   card. It is now a peer action here, using the same layout
   and palette as every other action.
   ========================================================= */

const actions = [
  {
    icon: FileText,
    label: "Create Resume",
    desc: "Build a new professional resume",
    to: "/editor",
  },
  {
    icon: Upload,
    label: "Import Resume",
    desc: "Upload an existing PDF or DOCX resume",
    to: "/import-resume",
  },
  {
    icon: Sparkles,
    label: "AI Analysis",
    desc: "Improve your resume for ATS",
    to: "/analysis",
  },
  {
    icon: Globe,
    label: "Portfolio",
    desc: "Create your professional portfolio",
    to: "/portfolio",
  },
  {
    icon: Target,
    label: "Job Match",
    desc: "Compare your resume with a job description",
    to: "/job-match",
  },
];

/* =========================================================
   PROFILE COMPLETION

   A transparent, deterministic ratio over canonical fields
   only. Nothing here is an ATS score and nothing is stored.

   Strings count as complete when they contain non-whitespace.
   Lists count as complete when they hold at least one entry.
   ========================================================= */

const PROFILE_CHECKS = [
  { key: "contact.name", isComplete: (r) => hasText(r.contact?.name) },
  { key: "contact.title", isComplete: (r) => hasText(r.contact?.title) },
  { key: "contact.email", isComplete: (r) => hasText(r.contact?.email) },
  { key: "contact.phone", isComplete: (r) => hasText(r.contact?.phone) },
  { key: "contact.location", isComplete: (r) => hasText(r.contact?.location) },
  { key: "contact.linkedin", isComplete: (r) => hasText(r.contact?.linkedin) },
  { key: "contact.github", isComplete: (r) => hasText(r.contact?.github) },
  { key: "summary", isComplete: (r) => hasText(r.summary) },
  {
    key: "experience",
    isComplete: (r) => Array.isArray(r.experience) && r.experience.length > 0,
  },
  {
    key: "education",
    isComplete: (r) => Array.isArray(r.education) && r.education.length > 0,
  },
  {
    key: "skills",
    isComplete: (r) => Array.isArray(r.skills) && r.skills.length > 0,
  },
];

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const getProfileCompletion = (resume) => {
  if (!resume) {
    return 0;
  }

  const completed = PROFILE_CHECKS.filter((check) =>
    check.isComplete(resume),
  ).length;

  return Math.round((completed / PROFILE_CHECKS.length) * 100);
};

const getIncompleteFields = (resume) =>
  PROFILE_CHECKS.filter((check) => !check.isComplete(resume)).map(
    (check) => check.key,
  );

/* Friendly labels for the profile completion hint. */
const FIELD_LABELS = {
  "contact.name": "full name",
  "contact.title": "professional title",
  "contact.email": "email",
  "contact.phone": "phone",
  "contact.location": "location",
  "contact.linkedin": "LinkedIn",
  "contact.github": "GitHub",
  summary: "summary",
  experience: "experience",
  education: "education",
  skills: "skills",
};

/* =========================================================
   SYNC STATUS

   Every state is reported truthfully. In particular an offline
   resume is never described as backed up: the local copy is the
   only copy we can honestly promise.
   ========================================================= */

const formatSyncedAt = (iso) => {
  if (!iso) return "";

  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) return "";

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;

  const days = Math.floor(seconds / 86400);

  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const describeSync = (sync) => {
  switch (sync.status) {
    case "syncing":
      return {
        icon: RefreshCw,
        tone: "text-[#2563EB]",
        spin: true,
        label: "Syncing…",
        detail: "Saving a copy to your account.",
      };

    case "synced":
      return {
        icon: Cloud,
        tone: "text-[#22C55E]",
        spin: false,
        label: "Saved to cloud",
        detail: sync.lastSyncedAt
          ? `Last synced ${formatSyncedAt(sync.lastSyncedAt)}.`
          : "Synced with your account.",
      };

    case "offline":
      return {
        icon: CloudOff,
        tone: "text-[#F59E0B]",
        spin: false,
        label: "Offline — saved on this device",
        detail: sync.lastError || "The server could not be reached.",
      };

    case "error":
      return {
        icon: AlertCircle,
        tone: "text-[#EF4444]",
        spin: false,
        label: "Not synced",
        detail: sync.lastError || "This resume has not reached your account.",
      };

    default:
      return {
        icon: Cloud,
        tone: "text-[#94A3B8]",
        spin: false,
        label: "Not synced yet",
        detail: "Save your resume to back it up to your account.",
      };
  }
};

const Dashboard = () => {
  const { user } = useAuth();

  /* =======================================================
     RESUME

     Read-only. loadResume() never writes, so opening the
     dashboard cannot alter stored data. A corrupt primary
     record falls through to the legacy record, and a resume
     with no meaningful content becomes null so the honest
     empty state is shown instead of misleading zeros.
  ======================================================= */

  const [resume] = useState(() => {
    const loaded = loadResume();

    return isEmptyResume(loaded) ? null : loaded;
  });

  const hasResume = Boolean(resume);

  /* =======================================================
     SYNC STATE

     Observed through the schema module's subscription so
     this page holds no sync state of its own.
  ======================================================= */

  const [sync, setSync] = useState(() => getResumeSyncState());

  useEffect(() => subscribeToResumeSync(setSync), []);

  const syncInfo = describeSync(sync);
  const SyncIcon = syncInfo.icon;

  const profileCompletion = getProfileCompletion(resume);
  const incompleteFields = hasResume ? getIncompleteFields(resume) : [];

  /* =======================================================
     STATISTICS

     Every value below is counted from the canonical resume.
     Metrics that cannot be measured truthfully are omitted
     rather than invented.
  ======================================================= */

  const stats = hasResume
    ? [
        {
          label: "Experience",
          value: String(resume.experience.length),
          detail:
            resume.experience.length === 1
              ? "role or position"
              : "roles or positions",
          icon: Briefcase,
        },
        {
          label: "Education",
          value: String(resume.education.length),
          detail:
            resume.education.length === 1 ? "qualification" : "qualifications",
          icon: GraduationCap,
        },
        {
          label: "Skills",
          value: String(resume.skills.length),
          detail: resume.skills.length === 1 ? "skill listed" : "skills listed",
          icon: Wrench,
        },
        {
          label: "Profile Completion",
          value: `${profileCompletion}%`,
          detail:
            incompleteFields.length === 0
              ? "all sections filled"
              : `add ${incompleteFields
                  .slice(0, 3)
                  .map((key) => FIELD_LABELS[key] || key)
                  .join(", ")}`,
          icon: CheckCircle2,
        },
      ]
    : [];

  return (
    <div
      className="flex min-h-screen bg-[#F8FAFC]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <Sidebar />

      <main className="flex-1 md:ml-60">
        {/* ========================================
            TOP HEADER
        ======================================== */}

        <header className="bg-white border-b border-[#E2E8F0]">
          <div className="px-6 md:px-10 py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#94A3B8] mb-1">
                Dashboard Overview
              </p>

              <h1 className="text-2xl font-bold text-[#0F172A]">
                Welcome back, {user?.firstName || "SmartResume User"}
              </h1>

              <p className="text-sm text-[#64748B] mt-1">
                {hasResume
                  ? "Keep your resume up to date and ready for opportunities."
                  : "Create your first resume or import an existing one to get started."}
              </p>
            </div>

            {/* HEADER ACTIONS */}

            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/import-resume"
                className="flex items-center gap-2 border border-[#E2E8F0] hover:border-[#2563EB] text-[#475569] hover:text-[#2563EB] bg-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                <Upload size={17} />
                Import Resume
              </Link>

              <Link
                to="/editor"
                className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              >
                <Plus size={17} />
                Create Resume
              </Link>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-[1500px] mx-auto">
          {/* ========================================
              EMPTY STATE

              Shown only when no meaningful resume exists. No
              fabricated cards, scores, dates or statistics
              are rendered in this branch.
          ======================================== */}

          {!hasResume && (
            <section className="mb-10 bg-white border border-[#E2E8F0] rounded-2xl p-8 md:p-12 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFF6FF] flex items-center justify-center">
                <FileText size={26} className="text-[#2563EB]" />
              </div>

              <h2 className="text-xl font-bold text-[#0F172A] mt-5">
                No resume yet
              </h2>

              <p className="text-sm text-[#64748B] mt-2 max-w-md mx-auto">
                Create your first resume or import an existing one to get
                started.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
                <Link
                  to="/editor"
                  className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                >
                  <Plus size={17} />
                  Create Resume
                </Link>

                <Link
                  to="/import-resume"
                  className="inline-flex items-center justify-center gap-2 border border-[#E2E8F0] hover:border-[#2563EB] text-[#475569] px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                >
                  <Upload size={17} />
                  Import Resume
                </Link>
              </div>
            </section>
          )}

          {/* ========================================
              STATISTICS
          ======================================== */}

          {hasResume && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#0F172A]">Overview</h2>

                <span className="text-xs text-[#94A3B8]">
                  From your saved resume
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, detail, icon: Icon }) => (
                  <div
                    key={label}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#CBD5E1] transition-colors"
                  >
                    <div className="mb-5">
                      <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                        <Icon size={18} className="text-[#475569]" />
                      </div>
                    </div>

                    <div className="text-2xl font-bold text-[#0F172A] mb-1">
                      {value}
                    </div>

                    <div className="text-xs text-[#64748B] mb-1">{label}</div>

                    <div className="text-[11px] text-[#94A3B8]">{detail}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ========================================
              QUICK ACTIONS

              Five actions, so the grid steps down from four
              columns to three on large screens.
          ======================================== */}

          <section className="mb-10">
            <h2 className="font-semibold text-[#0F172A] mb-4">Quick Actions</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {actions.map(({ icon: Icon, label, desc, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="group bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#93C5FD] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                      <Icon size={20} className="text-[#2563EB]" />
                    </div>

                    <ChevronRight
                      size={18}
                      className="text-[#CBD5E1] group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all"
                    />
                  </div>

                  <h3 className="font-semibold text-[#0F172A] text-sm mb-1">
                    {label}
                  </h3>

                  <p className="text-xs text-[#64748B]">{desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* ========================================
              YOUR RESUME

              The application is single-resume by design, so
              exactly one card is rendered. It shows
              `documentTitle` (the document name) and
              `contact.name` (the person). `contact.title` is
              deliberately NOT used as the document name.
          ======================================== */}

          {hasResume && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-[#0F172A]">
                    Your Resume
                  </h2>

                  <p className="text-xs text-[#94A3B8] mt-1">
                    SmartResume stores one resume at a time
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
                <div className="flex flex-wrap items-center gap-5 p-5">
                  <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                    <FileText size={19} className="text-[#2563EB]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#0F172A] text-sm truncate">
                      {resume.documentTitle?.trim() || "Untitled Resume"}
                    </h3>

                    <p className="text-xs text-[#94A3B8] mt-1 truncate">
                      {resume.contact?.name?.trim() || "No name added"}
                    </p>

                    {/* SYNC STATUS
                        Reflects real cloud-sync state. Never claims a backup
                        that has not happened. */}

                    <p
                      className={`text-[11px] mt-1.5 flex items-center gap-1.5 ${syncInfo.tone}`}
                    >
                      <SyncIcon
                        size={12}
                        className={syncInfo.spin ? "animate-spin" : ""}
                      />

                      <span className="font-medium">{syncInfo.label}</span>
                    </p>

                    <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
                      {syncInfo.detail}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/editor"
                      className="text-xs font-semibold text-[#475569] hover:text-[#2563EB] px-3 py-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
                    >
                      Edit
                    </Link>

                    <Link
                      to="/analysis"
                      className="text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] px-3 py-2 rounded-lg hover:bg-[#DBEAFE] transition-colors"
                    >
                      Analyze
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================
              PROFILE COMPLETION DETAIL

              Replaces the previous hardcoded "AI Career
              Insight". Every statement here is derived from
              the stored resume.
          ======================================== */}

          {hasResume && (
            <section className="mt-8">
              <div className="rounded-2xl bg-[#0F172A] p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 size={22} className="text-[#60A5FA]" />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-semibold text-white mb-1">
                    Profile Completion: {profileCompletion}%
                  </div>

                  <p className="text-sm text-[#CBD5E1] leading-relaxed">
                    {incompleteFields.length === 0
                      ? "Every profile section is filled in."
                      : `Still to add: ${incompleteFields
                          .map((key) => FIELD_LABELS[key] || key)
                          .join(", ")}.`}
                  </p>
                </div>

                <Link
                  to="/editor"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#0F172A] px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#F1F5F9] transition-colors whitespace-nowrap"
                >
                  Complete Profile
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;