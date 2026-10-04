import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Mail,
  Plus,
  Save,
  Trash2,
  Upload,
  Eye,
  Edit3,
  Globe,
} from "lucide-react";

import Sidebar from "../../components/Navbar/Sidebar";

import { loadResume, isEmptyResume, getResumeScope } from "../../lib/resumeSchema";

/* =========================================================
   THEMES
========================================================= */

const themes = [
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

/* =========================================================
   DEFAULT DATA
========================================================= */

const createDefaultProject = () => ({
  id: Date.now() + Math.random(),
  title: "",
  desc: "",
  tags: [],
  link: "",
});

const defaultPortfolio = {
  profile: {
    name: "",
    title: "",
    bio: "",
    email: "",
    linkedin: "",
    github: "",
  },
  projects: [],
  themeId: 1,
  published: false,
};

/* =========================================================
   ACCOUNT SCOPING

   Portfolio data is owned by the signed-in account. It used to
   live in a single browser-global `portfolioData` key, which
   meant User B could read User A's portfolio — including the
   contact details seeded from A's resume — and could overwrite
   it.

   This page is the sole owner of that key, so it derives the key
   here rather than adding a shared abstraction or changing the
   resume module:

     anonymous      portfolioData
     account <id>   portfolioData:u<id>

   An authenticated account NEVER reads the anonymous key.
   ========================================================= */

const PORTFOLIO_STORAGE_KEY = "portfolioData";

/** Marker proving the one-time legacy migration has already run. */
const PORTFOLIO_MIGRATION_MARKER_KEY = "smartresume_portfolio_migration_v1";

/** Namespace holding pre-authentication portfolio data that has no owner. */
const PORTFOLIO_QUARANTINE_KEY = "portfolioData:legacy-migrated";

const getPortfolioStorageKey = () => {
  const scope = getResumeScope();

  return scope === null
    ? PORTFOLIO_STORAGE_KEY
    : `${PORTFOLIO_STORAGE_KEY}:u${scope}`;
};

/**
 * One-time quarantine of the old browser-global `portfolioData`.
 *
 * Its ownership is unknowable: a portfolio carries no owner id, and it may
 * have been seeded from any account's resume. Rather than assign it to
 * whoever signs in first, it is moved to a namespace this page never reads,
 * preserving it for a future explicit recovery flow.
 *
 * Guarded by the marker so it can never run twice, and it never overwrites an
 * existing quarantined payload.
 */
const runPortfolioMigrationIfNeeded = () => {
  if (getResumeScope() === null) {
    // Only ever run inside an authenticated session, so the quarantine is
    // performed deliberately rather than on an anonymous visit.
    return;
  }

  try {
    if (localStorage.getItem(PORTFOLIO_MIGRATION_MARKER_KEY)) {
      return;
    }

    const legacyRaw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);

    if (legacyRaw) {
      if (localStorage.getItem(PORTFOLIO_QUARANTINE_KEY) === null) {
        localStorage.setItem(PORTFOLIO_QUARANTINE_KEY, legacyRaw);
      }

      localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
    }

    localStorage.setItem(
      PORTFOLIO_MIGRATION_MARKER_KEY,
      legacyRaw ? "quarantined" : "none",
    );
  } catch {
    // A failed migration must never block the page. Leaving the legacy key in
    // place is safe: no authenticated account reads it.
  }
};

/* =========================================================
   HELPERS
   ========================================================= */

const createSlug = (name = "") => {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "my-portfolio"
  );
};

const cleanUrl = (url = "") => {
  const value = url.trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:")
  ) {
    return value;
  }

  if (value.includes("@") && !value.includes("/")) {
    return `mailto:${value}`;
  }

  return `https://${value}`;
};

const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "SR";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

/* =========================================================
   PORTFOLIO COMPONENT
========================================================= */

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(defaultPortfolio);

  const [resume, setResume] = useState(null);

  const [activeTab, setActiveTab] = useState("editor");

  const [saved, setSaved] = useState(false);

  const [copied, setCopied] = useState(false);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    try {
      runPortfolioMigrationIfNeeded();

      const loadedResume = loadResume();

      const parsedResume = isEmptyResume(loadedResume) ? null : loadedResume;

      setResume(parsedResume);

      const storedPortfolio = localStorage.getItem(
        getPortfolioStorageKey(),
      );

      const savedPortfolio = storedPortfolio
        ? JSON.parse(storedPortfolio)
        : null;

      const initialProfile = {
        name:
          savedPortfolio?.profile?.name || parsedResume?.contact?.name || "",

        title:
          savedPortfolio?.profile?.title || parsedResume?.contact?.title || "",

        bio: savedPortfolio?.profile?.bio || parsedResume?.summary || "",

        email:
          savedPortfolio?.profile?.email || parsedResume?.contact?.email || "",

        linkedin:
          savedPortfolio?.profile?.linkedin ||
          parsedResume?.contact?.linkedin ||
          "",

        github:
          savedPortfolio?.profile?.github ||
          parsedResume?.contact?.github ||
          "",
      };

      const initialProjects = Array.isArray(savedPortfolio?.projects)
        ? savedPortfolio.projects
        : [];

      setPortfolio({
        profile: initialProfile,
        projects: initialProjects,
        themeId: savedPortfolio?.themeId || 1,
        published: Boolean(savedPortfolio?.published),
      });
    } catch (error) {
      console.error("Could not load portfolio data:", error);
    }
  }, []);

  /* =======================================================
     THEME

     Ensure the active theme is always defined within the
     component scope so render-time references cannot
     fall out of scope.
  ======================================================= */

  const theme = themes.find((item) => item.id === portfolio.themeId) ||
    themes[0] || {
      id: 1,
      name: "Minimal",
      bg: "#FFFFFF",
      accent: "#2563EB",
      text: "#0F172A",
      muted: "#64748B",
    };

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const skills = resume?.skills || [];

  const experience = resume?.experience || [];

  const education = resume?.education || [];

  const portfolioSlug = createSlug(portfolio.profile.name);

  const portfolioUrl = `https://smartresume.app/portfolio/${portfolioSlug}`;

  /* =======================================================
     PROFILE UPDATE
  ======================================================= */

  const updateProfile = (field, value) => {
    setPortfolio((current) => ({
      ...current,

      profile: {
        ...current.profile,
        [field]: value,
      },
    }));

    setSaved(false);
  };

  /* =======================================================
     THEME UPDATE
  ======================================================= */

  const updateTheme = (themeId) => {
    setPortfolio((current) => ({
      ...current,
      themeId,
    }));

    setSaved(false);
  };

  /* =======================================================
     ADD PROJECT
  ======================================================= */

  const addProject = () => {
    setPortfolio((current) => ({
      ...current,

      projects: [...current.projects, createDefaultProject()],
    }));

    setSaved(false);
  };

  /* =======================================================
     UPDATE PROJECT
  ======================================================= */

  const updateProject = (projectId, field, value) => {
    setPortfolio((current) => ({
      ...current,

      projects: current.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              [field]: value,
            }
          : project,
      ),
    }));

    setSaved(false);
  };

  /* =======================================================
     UPDATE PROJECT TAGS
  ======================================================= */

  const updateProjectTags = (projectId, value) => {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    updateProject(projectId, "tags", tags);
  };

  /* =======================================================
     DELETE PROJECT
  ======================================================= */

  const deleteProject = (projectId) => {
    setPortfolio((current) => ({
      ...current,

      projects: current.projects.filter((project) => project.id !== projectId),
    }));

    setSaved(false);
  };

  /* =======================================================
     SAVE PORTFOLIO
  ======================================================= */

  const savePortfolio = () => {
    try {
      localStorage.setItem(
        getPortfolioStorageKey(),
        JSON.stringify(portfolio),
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error("Could not save portfolio:", error);
    }
  };

  /* =======================================================
     PUBLISH / UNPUBLISH
  ======================================================= */

  const togglePublish = () => {
    if (!portfolio.profile.name.trim()) {
      alert("Please add your display name before publishing your portfolio.");

      return;
    }

    if (!portfolio.profile.title.trim()) {
      alert("Please add your tagline or professional title before publishing.");

      return;
    }

    const nextPublished = !portfolio.published;

    const updatedPortfolio = {
      ...portfolio,
      published: nextPublished,
    };

setPortfolio(updatedPortfolio);

      localStorage.setItem(
        getPortfolioStorageKey(),
        JSON.stringify(updatedPortfolio),
      );
    };

  /* =======================================================
     COPY PORTFOLIO LINK
  ======================================================= */

  const copyPortfolioLink = async () => {
    try {
      await navigator.clipboard.writeText(portfolioUrl);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Could not copy portfolio link:", error);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="min-h-screen bg-[#F8FAFC]"
      style={{
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <Sidebar />

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="md:ml-60 min-h-screen flex flex-col">
        {/* =================================================
            TOP BAR
        ================================================= */}

        <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0]">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* LEFT */}
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#475569] hover:bg-[#F8FAFC] transition"
                >
                  <ArrowLeft size={18} />
                </Link>

                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                    Portfolio Builder
                  </h1>

                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        portfolio.published ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />

                    <span className="text-xs text-[#64748B]">
                      {portfolio.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-2">
                {/* MOBILE TABS */}

                <div className="hidden sm:flex md:hidden bg-[#F1F5F9] rounded-xl p-1">
                  <button
                    onClick={() => setActiveTab("editor")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === "editor"
                        ? "bg-white text-[#0F172A] shadow-sm"
                        : "text-[#64748B]"
                    }`}
                  >
                    <Edit3 size={15} className="inline mr-1" />
                    Edit
                  </button>

                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === "preview"
                        ? "bg-white text-[#0F172A] shadow-sm"
                        : "text-[#64748B]"
                    }`}
                  >
                    <Eye size={15} className="inline mr-1" />
                    Preview
                  </button>
                </div>

                {/* SAVE */}

                <button
                  onClick={savePortfolio}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#334155] text-sm font-semibold hover:bg-[#F8FAFC] transition"
                >
                  {saved ? (
                    <>
                      <Check size={16} />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save
                    </>
                  )}
                </button>

                {/* PUBLISH */}

                <button
                  onClick={togglePublish}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition"
                >
                  <Globe size={16} />

                  {portfolio.published ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1500px] mx-auto">
            {/* MOBILE TAB SWITCHER */}

            <div className="flex md:hidden bg-white border border-[#E2E8F0] rounded-xl p-1 mb-5">
              <button
                onClick={() => setActiveTab("editor")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${
                  activeTab === "editor"
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-[#64748B]"
                }`}
              >
                <Edit3 size={15} className="inline mr-1.5" />
                Editor
              </button>

              <button
                onClick={() => setActiveTab("preview")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${
                  activeTab === "preview"
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-[#64748B]"
                }`}
              >
                <Eye size={15} className="inline mr-1.5" />
                Preview
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* =================================================
                  EDITOR
              ================================================= */}

              <section
                className={`space-y-6 ${
                  activeTab === "preview" ? "hidden md:block" : ""
                }`}
              >
                {/* =================================================
                    THEME
                ================================================= */}

                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
                  <SectionTitle
                    title="Choose a theme"
                    description="Select the visual style for your portfolio."
                  />

                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => updateTheme(item.id)}
                        className={`relative rounded-xl overflow-hidden border-2 transition ${
                          portfolio.themeId === item.id
                            ? "border-[#2563EB]"
                            : "border-[#E2E8F0]"
                        }`}
                      >
                        <div
                          className="h-20 p-3"
                          style={{
                            backgroundColor: item.bg,
                          }}
                        >
                          <div
                            className="w-1/2 h-2 rounded mb-2"
                            style={{
                              backgroundColor: item.accent,
                            }}
                          />

                          <div
                            className="w-3/4 h-1.5 rounded"
                            style={{
                              backgroundColor: item.muted,
                              opacity: 0.5,
                            }}
                          />

                          <div
                            className="w-1/2 h-1.5 rounded mt-2"
                            style={{
                              backgroundColor: item.muted,
                              opacity: 0.3,
                            }}
                          />
                        </div>

                        <div className="bg-white px-3 py-2 text-left">
                          <p className="text-xs font-semibold text-[#334155]">
                            {item.name}
                          </p>
                        </div>

                        {portfolio.themeId === item.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* =================================================
                    PROFILE
                ================================================= */}

                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
                  <SectionTitle
                    title="Profile"
                    description="This information appears at the top of your portfolio."
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProfileField
                      label="Display Name"
                      value={portfolio.profile.name}
                      placeholder="Your name"
                      onChange={(value) => updateProfile("name", value)}
                    />

                    <ProfileField
                      label="Tagline / Professional Title"
                      value={portfolio.profile.title}
                      placeholder="e.g. Software Engineer"
                      onChange={(value) => updateProfile("title", value)}
                    />

                    <ProfileField
                      label="Email"
                      value={portfolio.profile.email}
                      placeholder="you@example.com"
                      onChange={(value) => updateProfile("email", value)}
                    />

                    <ProfileField
                      label="GitHub"
                      value={portfolio.profile.github}
                      placeholder="github.com/username"
                      onChange={(value) => updateProfile("github", value)}
                    />

                    <ProfileField
                      label="LinkedIn"
                      value={portfolio.profile.linkedin}
                      placeholder="linkedin.com/in/username"
                      onChange={(value) => updateProfile("linkedin", value)}
                    />

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-[#334155] mb-2">
                        Bio
                      </label>

                      <textarea
                        value={portfolio.profile.bio}
                        onChange={(event) =>
                          updateProfile("bio", event.target.value)
                        }
                        placeholder="Tell people about yourself..."
                        rows={5}
                        className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 resize-none"
                      />
                    </div>
                  </div>

                  {/* RESUME DATA NOTICE */}

                  {resume && (
                    <div className="mt-5 p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center flex-shrink-0">
                          <Upload size={17} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-[#1E3A8A]">
                            Connected to your resume
                          </p>

                          <p className="text-xs text-[#3B82F6] mt-1">
                            Your profile, experience and skills are
                            automatically pulled from your saved resume.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* =================================================
                    PROJECTS
                ================================================= */}

                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <SectionTitle
                      title="Projects"
                      description="Showcase your best work."
                    />

                    <button
                      onClick={addProject}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EFF6FF] text-[#2563EB] text-sm font-semibold hover:bg-[#DBEAFE] transition"
                    >
                      <Plus size={16} />
                      Add Project
                    </button>
                  </div>

                  {portfolio.projects.length === 0 ? (
                    <div className="border border-dashed border-[#CBD5E1] rounded-xl p-8 text-center">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#64748B] mb-3">
                        <Plus size={20} />
                      </div>

                      <p className="text-sm font-semibold text-[#334155] mb-1">
                        No projects yet
                      </p>

                      <p className="text-xs text-[#64748B]">
                        Add at least one project to make your portfolio stand
                        out.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {portfolio.projects.map((project) => (
                        <div
                          key={project.id}
                          className="rounded-xl border border-[#E2E8F0] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={project.title}
                                onChange={(event) =>
                                  updateProject(
                                    project.id,
                                    "title",
                                    event.target.value,
                                  )
                                }
                                placeholder="Project title"
                                className="w-full text-sm font-semibold text-[#0F172A] border border-[#E2E8F0] rounded-lg px-3 py-2 mb-2 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                              />

                              <textarea
                                value={project.desc}
                                onChange={(event) =>
                                  updateProject(
                                    project.id,
                                    "desc",
                                    event.target.value,
                                  )
                                }
                                placeholder="Describe the project and your impact..."
                                rows={4}
                                className="w-full text-sm text-[#334155] border border-[#E2E8F0] rounded-lg px-3 py-2 resize-none outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                              />

                              <input
                                type="text"
                                value={project.tags.join(", ")}
                                onChange={(event) =>
                                  updateProjectTags(
                                    project.id,
                                    event.target.value,
                                  )
                                }
                                placeholder="React, Tailwind, API"
                                className="w-full mt-3 text-sm text-[#334155] border border-[#E2E8F0] rounded-lg px-3 py-2 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                              />

                              <input
                                type="text"
                                value={project.link}
                                onChange={(event) =>
                                  updateProject(
                                    project.id,
                                    "link",
                                    event.target.value,
                                  )
                                }
                                placeholder="Project link or demo URL"
                                className="w-full mt-3 text-sm text-[#334155] border border-[#E2E8F0] rounded-lg px-3 py-2 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                              />
                            </div>

                            <button
                              onClick={() => deleteProject(project.id)}
                              className="p-2 rounded-lg text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#EF4444] transition"
                              title="Delete project"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* =================================================
                    SAVE CARD
                ================================================= */}

                <div className="bg-[#0F172A] rounded-2xl p-5 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">Save your portfolio</h3>

                      <p className="text-sm text-[#CBD5E1] mt-1">
                        Your portfolio is currently stored locally on this
                        device.
                      </p>
                    </div>

                    <button
                      onClick={savePortfolio}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0F172A] text-sm font-semibold hover:bg-[#F8FAFC] transition"
                    >
                      {saved ? (
                        <>
                          <Check size={16} />
                          Saved
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Portfolio
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </section>

              {/* =================================================
                  PREVIEW
              ================================================= */}

              <section
                className={`${
                  activeTab === "editor" ? "hidden md:block" : ""
                } rounded-2xl border border-[#E2E8F0] overflow-hidden`}
              >
                <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      Live Preview
                    </p>

                    <p className="text-xs text-[#64748B] mt-0.5">
                      See how your portfolio looks.
                    </p>
                  </div>

                  {portfolio.published && (
                    <button
                      onClick={copyPortfolioLink}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F1F5F9] text-[#334155] text-xs font-semibold hover:bg-[#E2E8F0] transition"
                    >
                      {copied ? (
                        <>
                          <Check size={14} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy Link
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div
                  className="min-h-[750px]"
                  style={{
                    backgroundColor: theme.bg,
                    color: theme.text,
                  }}
                >
                  {/* HERO */}

                  <div className="px-6 sm:px-10 pt-10 pb-8">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-5"
                      style={{
                        backgroundColor: theme.accent,
                      }}
                    >
                      {getInitials(portfolio.profile.name)}
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight">
                      {portfolio.profile.name || "Your Name"}
                    </h2>

                    <p
                      className="text-lg font-medium mt-2"
                      style={{
                        color: theme.accent,
                      }}
                    >
                      {portfolio.profile.title || "Your Professional Title"}
                    </p>

                    <p
                      className="text-sm leading-6 mt-4 max-w-2xl"
                      style={{
                        color: theme.muted,
                      }}
                    >
                      {portfolio.profile.bio ||
                        "Your professional summary will appear here. Add a short introduction about yourself, your skills, and what you do."}
                    </p>

                    {/* SOCIAL LINKS */}

                    <div className="flex flex-wrap gap-2 mt-6">
                      {portfolio.profile.email && (
                        <a
                          href={cleanUrl(portfolio.profile.email)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border"
                          style={{
                            borderColor: `${theme.accent}40`,
                            color: theme.accent,
                          }}
                        >
                          <Mail size={14} />
                          Email
                        </a>
                      )}

                      {portfolio.profile.linkedin && (
                        <a
                          href={cleanUrl(portfolio.profile.linkedin)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border"
                          style={{
                            borderColor: `${theme.accent}40`,
                            color: theme.accent,
                          }}
                        >
                          <Globe size={14} />
                          LinkedIn
                        </a>
                      )}

                      {portfolio.profile.github && (
                        <a
                          href={cleanUrl(portfolio.profile.github)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border"
                          style={{
                            borderColor: `${theme.accent}40`,
                            color: theme.accent,
                          }}
                        >
                          <Globe size={14} />
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>

                  {/* DIVIDER */}

                  <div
                    className="mx-6 sm:mx-10 border-t"
                    style={{
                      borderColor: `${theme.accent}20`,
                    }}
                  />

                  {/* EXPERIENCE */}

                  <div className="px-6 sm:px-10 py-8">
                    <h3
                      className="text-sm font-bold uppercase tracking-wider mb-5"
                      style={{
                        color: theme.accent,
                      }}
                    >
                      Experience
                    </h3>

                    {experience.length > 0 ? (
                      <div className="space-y-6">
                        {experience.map((item, index) => (
                          <div key={item.id || index} className="relative pl-5">
                            <div
                              className="absolute left-0 top-1.5 w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: theme.accent,
                              }}
                            />

                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                              <div>
                                <h4 className="font-semibold">
                                  {item.role || "Role"}
                                </h4>

                                <p
                                  className="text-sm mt-1"
                                  style={{
                                    color: theme.accent,
                                  }}
                                >
                                  {item.company || "Company"}
                                </p>
                              </div>

                              {item.period && (
                                <span
                                  className="text-xs"
                                  style={{
                                    color: theme.muted,
                                  }}
                                >
                                  {item.period}
                                </span>
                              )}
                            </div>

                            {Array.isArray(item.bullets) &&
                              item.bullets.length > 0 && (
                                <ul
                                  className="mt-3 space-y-2 text-sm leading-5"
                                  style={{
                                    color: theme.muted,
                                  }}
                                >
                                  {item.bullets.map((bullet, bulletIndex) => (
                                    <li
                                      key={bulletIndex}
                                      className="flex gap-2"
                                    >
                                      <span>•</span>

                                      <span>{bullet}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyPreview
                        text="Add experience to your resume and it will appear here."
                        theme={theme}
                      />
                    )}
                  </div>

                  {/* PROJECTS */}

                  <div className="px-6 sm:px-10 py-8">
                    <h3
                      className="text-sm font-bold uppercase tracking-wider mb-5"
                      style={{
                        color: theme.accent,
                      }}
                    >
                      Featured Projects
                    </h3>

                    {portfolio.projects.filter(
                      (project) => project.title || project.desc,
                    ).length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {portfolio.projects
                          .filter((project) => project.title || project.desc)
                          .map((project) => (
                            <div
                              key={project.id}
                              className="rounded-xl border p-4"
                              style={{
                                borderColor: `${theme.accent}25`,
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="font-semibold">
                                    {project.title || "Untitled Project"}
                                  </h4>

                                  {project.desc && (
                                    <p
                                      className="text-sm leading-5 mt-2"
                                      style={{
                                        color: theme.muted,
                                      }}
                                    >
                                      {project.desc}
                                    </p>
                                  )}
                                </div>

                                {project.link && (
                                  <a
                                    href={cleanUrl(project.link)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-shrink-0"
                                    style={{
                                      color: theme.accent,
                                    }}
                                  >
                                    <ExternalLink size={17} />
                                  </a>
                                )}
                              </div>

                              {project.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {project.tags.map((tag, tagIndex) => (
                                    <span
                                      key={`${project.id}-${tagIndex}`}
                                      className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                                      style={{
                                        backgroundColor: `${theme.accent}12`,
                                        color: theme.accent,
                                      }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <EmptyPreview
                        text="Add your projects to showcase your work."
                        theme={theme}
                      />
                    )}
                  </div>

                  {/* SKILLS */}

                  <div className="px-6 sm:px-10 py-8">
                    <h3
                      className="text-sm font-bold uppercase tracking-wider mb-5"
                      style={{
                        color: theme.accent,
                      }}
                    >
                      Skills
                    </h3>

                    {skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="px-3 py-2 rounded-lg text-xs font-medium border"
                            style={{
                              borderColor: `${theme.accent}25`,
                              color: theme.text,
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <EmptyPreview
                        text="Your resume skills will appear here."
                        theme={theme}
                      />
                    )}
                  </div>

                  {/* EDUCATION */}

                  {education.length > 0 && (
                    <div className="px-6 sm:px-10 py-8">
                      <h3
                        className="text-sm font-bold uppercase tracking-wider mb-5"
                        style={{
                          color: theme.accent,
                        }}
                      >
                        Education
                      </h3>

                      <div className="space-y-4">
                        {education.map((item, index) => (
                          <div
                            key={item.id || index}
                            className="flex flex-col sm:flex-row sm:justify-between gap-1"
                          >
                            <div>
                              <h4 className="font-semibold">
                                {item.degree || "Degree"}
                              </h4>

                              <p
                                className="text-sm mt-1"
                                style={{
                                  color: theme.muted,
                                }}
                              >
                                {item.school || "Institution"}
                              </p>
                            </div>

                            {item.period && (
                              <span
                                className="text-xs"
                                style={{
                                  color: theme.muted,
                                }}
                              >
                                {item.period}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FOOTER */}

                  <div
                    className="px-6 sm:px-10 py-6 border-t"
                    style={{
                      borderColor: `${theme.accent}20`,
                    }}
                  >
                    <p
                      className="text-xs"
                      style={{
                        color: theme.muted,
                      }}
                    >
                      Built with SmartResume
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* =========================================================
   PROFILE FIELD
========================================================= */

const ProfileField = ({ label, value, placeholder, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#334155] mb-2">
        {label}
      </label>

      <input
        type="text"
        value={value || ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
      />
    </div>
  );
};

/* =========================================================
   SECTION TITLE
========================================================= */

const SectionTitle = ({ title, description }) => {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold text-[#0F172A]">{title}</h2>

      {description && (
        <p className="text-xs text-[#64748B] mt-1">{description}</p>
      )}
    </div>
  );
};

/* =========================================================
   EMPTY PREVIEW
========================================================= */

const EmptyPreview = ({ text, theme }) => {
  return (
    <div
      className="rounded-xl border border-dashed p-4"
      style={{
        borderColor: `${theme.accent}30`,
      }}
    >
      <p
        className="text-sm"
        style={{
          color: theme.muted,
        }}
      >
        {text}
      </p>
    </div>
  );
};

export default Portfolio;
