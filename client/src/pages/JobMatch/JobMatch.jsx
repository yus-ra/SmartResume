import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadResume, isEmptyResume } from "../../lib/resumeSchema";
import {
  Target,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Briefcase,
  Search,
  RotateCcw,
} from "lucide-react";

import Sidebar from "../../components/Navbar/Sidebar";

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_JOB_DESCRIPTION_LENGTH = 15000;

/* =========================================================
   TEXT HELPERS
========================================================= */

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^\w\s+#./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const unique = (items) => [...new Set(items.filter(Boolean))];

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* =========================================================
   SKILL / TECHNOLOGY ALIASES
========================================================= */

const TERM_ALIASES = {
  "node js": "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",

  "react js": "React",
  reactjs: "React",

  "next js": "Next.js",
  nextjs: "Next.js",
  "next.js": "Next.js",

  "vue js": "Vue.js",
  vuejs: "Vue.js",

  "express js": "Express.js",
  expressjs: "Express.js",

  "github actions": "GitHub Actions",

  "ci cd": "CI/CD",
  "ci/cd": "CI/CD",

  "rest api": "REST API",
  "rest apis": "REST API",

  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",

  "mongo db": "MongoDB",
  mongodb: "MongoDB",

  "amazon web services": "AWS",
  aws: "AWS",

  "google cloud platform": "GCP",
  gcp: "GCP",

  "microsoft azure": "Azure",
  azure: "Azure",

  k8s: "Kubernetes",
  kubernetes: "Kubernetes",

  docker: "Docker",
  terraform: "Terraform",
  ansible: "Ansible",
  jenkins: "Jenkins",

  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  "c sharp": "C#",
  "c#": "C#",

  html: "HTML",
  css: "CSS",

  "tailwind css": "Tailwind CSS",
  tailwind: "Tailwind CSS",

  linux: "Linux",
  git: "Git",
  github: "GitHub",

  figma: "Figma",
  "adobe photoshop": "Photoshop",
  photoshop: "Photoshop",
  illustrator: "Illustrator",

  "power bi": "Power BI",
  tableau: "Tableau",
  "microsoft excel": "Excel",
  excel: "Excel",

  "machine learning": "Machine Learning",
  "artificial intelligence": "Artificial Intelligence",

  sql: "SQL",
  graphql: "GraphQL",

  agile: "Agile",
  scrum: "Scrum",
  jira: "Jira",

  "communication skills": "Communication",
  "leadership skills": "Leadership",
  "problem solving": "Problem Solving",
  "project management": "Project Management",
};

/* =========================================================
   COMMON PROFESSIONAL TERMS
========================================================= */

const COMMON_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Express.js",
  "Python",
  "Java",
  "C#",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Git",
  "GitHub",
  "REST API",
  "GraphQL",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "Terraform",
  "Ansible",
  "Jenkins",
  "GitHub Actions",
  "Linux",
  "CI/CD",
  "Figma",
  "Photoshop",
  "Illustrator",
  "Excel",
  "Power BI",
  "Tableau",
  "Machine Learning",
  "Artificial Intelligence",
  "Agile",
  "Scrum",
  "Jira",
  "Communication",
  "Leadership",
  "Problem Solving",
  "Project Management",
  "Research",
  "Data Analysis",
  "Customer Service",
  "Sales",
  "Marketing",
  "Recruitment",
];

/* =========================================================
   JOB TITLE GROUPS
========================================================= */

const JOB_TITLE_GROUPS = {
  software: [
    "software engineer",
    "software developer",
    "frontend developer",
    "front end developer",
    "backend developer",
    "back end developer",
    "full stack developer",
    "fullstack developer",
    "web developer",
    "application developer",
  ],

  devops: [
    "devops engineer",
    "cloud engineer",
    "site reliability engineer",
    "sre",
    "platform engineer",
    "cloud developer",
    "infrastructure engineer",
  ],

  data: [
    "data analyst",
    "data scientist",
    "data engineer",
    "business analyst",
    "machine learning engineer",
  ],

  cybersecurity: [
    "cybersecurity analyst",
    "cyber security analyst",
    "security analyst",
    "security engineer",
    "soc analyst",
    "information security analyst",
  ],

  design: [
    "ui designer",
    "ux designer",
    "product designer",
    "graphic designer",
    "visual designer",
  ],

  marketing: [
    "marketing manager",
    "digital marketer",
    "digital marketing",
    "social media manager",
    "content marketer",
    "marketing specialist",
  ],

  finance: [
    "accountant",
    "financial analyst",
    "finance analyst",
    "auditor",
    "accounting officer",
  ],

  hr: [
    "human resources",
    "hr specialist",
    "hr manager",
    "recruiter",
    "talent acquisition",
    "people operations",
  ],

  project: [
    "project manager",
    "program manager",
    "product manager",
    "scrum master",
    "project coordinator",
  ],

  sales: [
    "sales representative",
    "sales manager",
    "account executive",
    "business development",
    "sales executive",
  ],
};

/* =========================================================
   BUILD RESUME SEARCH TEXT
   ========================================================= */

function buildResumeText(resume) {
  return normalizeText(
    [
      resume.contact.name,
      resume.contact.title,
      resume.contact.email,
      resume.contact.phone,
      resume.contact.location,
      resume.contact.linkedin,
      resume.summary,

      ...resume.experience.flatMap((item) => [
        item.role,
        item.company,
        item.period,
        ...item.bullets,
      ]),

      ...resume.education.flatMap((item) => [
        item.degree,
        item.school,
        item.period,
      ]),

      ...resume.skills,
    ].join(" "),
  );
}

/* =========================================================
   TERM NORMALIZATION
========================================================= */

function canonicalizeTerm(term) {
  const normalized = normalizeText(term);

  return TERM_ALIASES[normalized] || term.trim();
}

function canonicalizeTerms(terms) {
  return unique(terms.map((term) => canonicalizeTerm(term)));
}

/* =========================================================
   FIND SKILLS IN JOB DESCRIPTION
========================================================= */

function extractSkills(jobDescription) {
  const normalizedJob = normalizeText(jobDescription);

  const detected = [];

  COMMON_SKILLS.forEach((skill) => {
    const normalizedSkill = normalizeText(skill);

    const pattern = new RegExp(
      `(^|\\s)${escapeRegex(normalizedSkill)}(?=\\s|$)`,
      "i",
    );

    if (pattern.test(normalizedJob)) {
      detected.push(skill);
    }
  });

  return canonicalizeTerms(detected);
}

/* =========================================================
   EXTRACT SKILLS FROM RESUME
========================================================= */

function extractResumeSkills(resume) {
  const resumeText = buildResumeText(resume);

  const detected = [];

  COMMON_SKILLS.forEach((skill) => {
    const normalizedSkill = normalizeText(skill);

    const pattern = new RegExp(
      `(^|\\s)${escapeRegex(normalizedSkill)}(?=\\s|$)`,
      "i",
    );

    if (pattern.test(resumeText)) {
      detected.push(skill);
    }
  });

  resume.skills.forEach((skill) => {
    if (String(skill).trim()) {
      detected.push(canonicalizeTerm(skill));
    }
  });

  return canonicalizeTerms(detected);
}

/* =========================================================
   JOB CATEGORY
========================================================= */

function detectJobCategory(jobTitle, jobDescription) {
  const source = normalizeText(`${jobTitle} ${jobDescription}`);

  let bestCategory = null;
  let bestScore = 0;

  Object.entries(JOB_TITLE_GROUPS).forEach(([category, titles]) => {
    let score = 0;

    titles.forEach((title) => {
      if (source.includes(normalizeText(title))) {
        score += 3;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  });

  return bestCategory;
}

/* =========================================================
   TITLE MATCH
========================================================= */

function analyzeTitleMatch(resume, jobTitle) {
  if (!jobTitle.trim() || !resume.contact.title.trim()) {
    return {
      score: 50,
      matched: false,
      reason: "Not enough title information to compare.",
    };
  }

  const resumeTitle = normalizeText(resume.contact.title);
  const targetTitle = normalizeText(jobTitle);

  const resumeWords = new Set(resumeTitle.split(" "));
  const targetWords = targetTitle.split(" ");

  const meaningfulWords = targetWords.filter(
    (word) =>
      word.length > 2 &&
      !["the", "and", "for", "with", "junior", "senior"].includes(word),
  );

  const matchedWords = meaningfulWords.filter((word) => resumeWords.has(word));

  if (!meaningfulWords.length) {
    return {
      score: 50,
      matched: false,
      reason: "Could not identify enough meaningful title terms.",
    };
  }

  const score = Math.round(
    (matchedWords.length / meaningfulWords.length) * 100,
  );

  return {
    score,
    matched: score >= 50,
    reason:
      score >= 50
        ? "Your professional title shares relevant terms with the role."
        : "Your professional title does not closely match the target role.",
  };
}

/* =========================================================
   EXPERIENCE MATCH
========================================================= */

function analyzeExperienceMatch(resume, jobDescription) {
  const jobText = normalizeText(jobDescription);

  if (!resume.experience.length) {
    return {
      score: 0,
      relevantEntries: 0,
      totalEntries: 0,
    };
  }

  const jobWords = unique(
    jobText.split(" ").filter((word) => word.length >= 5),
  );

  const relevantEntries = resume.experience.filter((entry) => {
    const entryText = normalizeText(
      [entry.role, entry.company, ...entry.bullets].join(" "),
    );

    const matches = jobWords.filter((word) => entryText.includes(word));

    return matches.length >= 2;
  });

  const score = Math.round(
    (relevantEntries.length / resume.experience.length) * 100,
  );

  return {
    score,
    relevantEntries: relevantEntries.length,
    totalEntries: resume.experience.length,
  };
}

/* =========================================================
   KEYWORD MATCH
========================================================= */

function analyzeKeywordMatch(resume, jobDescription) {
  const jobSkills = extractSkills(jobDescription);
  const resumeSkills = extractResumeSkills(resume);

  const normalizedResumeSkills = resumeSkills.map(normalizeText);

  const matched = jobSkills.filter((skill) =>
    normalizedResumeSkills.includes(normalizeText(skill)),
  );

  const missing = jobSkills.filter(
    (skill) => !normalizedResumeSkills.includes(normalizeText(skill)),
  );

  const score = jobSkills.length
    ? Math.round((matched.length / jobSkills.length) * 100)
    : 50;

  return {
    jobSkills,
    resumeSkills,
    matched,
    missing,
    score,
  };
}

/* =========================================================
   REQUIREMENTS
========================================================= */

function analyzeRequirements(jobDescription) {
  const normalized = normalizeText(jobDescription);

  const requirements = [];

  const patterns = [
    {
      label: "Bachelor's degree",
      pattern: /bachelor|b\.?sc|b\.?a\.?|university degree/i,
    },
    {
      label: "Master's degree",
      pattern: /master|m\.?sc|m\.?a\.?/i,
    },
    {
      label: "Team collaboration",
      pattern: /collaborat|cross functional|team environment/i,
    },
    {
      label: "Communication",
      pattern: /communication|communicate|presentation/i,
    },
    {
      label: "Problem solving",
      pattern: /problem solving|troubleshoot|analytical thinking/i,
    },
    {
      label: "Leadership",
      pattern: /leadership|lead a team|mentor|supervis/i,
    },
  ];

  patterns.forEach(({ label, pattern }) => {
    if (pattern.test(normalized)) {
      requirements.push(label);
    }
  });

  return unique(requirements);
}

/* =========================================================
   REQUIREMENT MATCH
========================================================= */

function analyzeSoftRequirements(resume, jobDescription) {
  const requirements = analyzeRequirements(jobDescription);

  const resumeText = buildResumeText(resume);

  const matched = requirements.filter((requirement) => {
    const normalized = normalizeText(requirement);

    if (normalized === "bachelor's degree") {
      return resume.education.some((item) =>
        /bachelor|b\.?sc|b\.?a\.?/i.test(`${item.degree} ${item.school}`),
      );
    }

    if (normalized === "master's degree") {
      return resume.education.some((item) =>
        /master|m\.?sc|m\.?a\.?/i.test(`${item.degree} ${item.school}`),
      );
    }

    return resumeText.includes(normalized);
  });

  const missing = requirements.filter(
    (requirement) => !matched.includes(requirement),
  );

  const score = requirements.length
    ? Math.round((matched.length / requirements.length) * 100)
    : 50;

  return {
    requirements,
    matched,
    missing,
    score,
  };
}

/* =========================================================
   OVERALL MATCH SCORE
========================================================= */

function calculateMatchScore({ keywords, title, experience, requirements }) {
  return Math.round(
    keywords * 0.45 + title * 0.15 + experience * 0.25 + requirements * 0.15,
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

const JobMatch = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const storedResume = useMemo(() => {
    // Read-only. loadResume() never writes, so opening this page cannot alter
    // stored data. It also falls through a corrupt resumeData to a valid
    // legacy cvData record instead of masking it. A resume with no content
    // keeps the null sentinel so the honest "No Resume Found" state is shown.
    const loaded = loadResume();

    return isEmptyResume(loaded) ? null : loaded;
  }, []);

  const analysis = useMemo(() => {
    if (!hasAnalyzed || !storedResume || !jobDescription.trim()) {
      return null;
    }

    const keywordAnalysis = analyzeKeywordMatch(storedResume, jobDescription);

    const titleAnalysis = analyzeTitleMatch(storedResume, jobTitle);

    const experienceAnalysis = analyzeExperienceMatch(
      storedResume,
      jobDescription,
    );

    const requirementAnalysis = analyzeSoftRequirements(
      storedResume,
      jobDescription,
    );

    const overall = calculateMatchScore({
      keywords: keywordAnalysis.score,
      title: titleAnalysis.score,
      experience: experienceAnalysis.score,
      requirements: requirementAnalysis.score,
    });

    const category = detectJobCategory(jobTitle, jobDescription);

    return {
      overall,
      category,
      keywordAnalysis,
      titleAnalysis,
      experienceAnalysis,
      requirementAnalysis,
    };
  }, [hasAnalyzed, storedResume, jobTitle, jobDescription]);

  const handleAnalyze = () => {
    if (!jobDescription.trim()) return;

    setHasAnalyzed(true);
  };

  const handleReset = () => {
    setJobTitle("");
    setCompany("");
    setJobDescription("");
    setHasAnalyzed(false);
  };

  const resumeExists = Boolean(storedResume);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar />

      {/* =====================================================
          PAGE CONTENT
      ===================================================== */}

      <div className="ml-60 min-h-screen">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="bg-white border-b border-gray-100">
          <div className="px-12 py-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition"
            >
              ← Dashboard
            </Link>

            <div className="mt-5">
              <h1 className="text-3xl font-bold text-gray-900">Job Match</h1>

              <p className="text-gray-500 mt-2 max-w-3xl">
                Compare your resume with a job description to discover how well
                your experience and skills align with the role.
              </p>
            </div>
          </div>
        </header>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="px-12 py-10">
          <div className="max-w-[1400px] mx-auto">
            {!resumeExists ? (
              /* =================================================
                 NO RESUME
              ================================================= */

              <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center">
                  <FileText size={30} className="text-blue-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mt-5">
                  No Resume Found
                </h2>

                <p className="text-gray-500 mt-2 leading-6">
                  Create or import a resume before comparing it with a job
                  description.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
                  <Link
                    to="/editor"
                    className="px-5 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition"
                  >
                    Create Resume
                  </Link>

                  <Link
                    to="/import-resume"
                    className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    Import Resume
                  </Link>
                </div>
              </div>
            ) : !analysis ? (
              /* =================================================
                 JOB INPUT
              ================================================= */

              <div className="grid xl:grid-cols-[1fr_360px] gap-8">
                {/* JOB FORM */}

                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-9">
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                      <Target size={25} className="text-white" />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Add a Job Description
                      </h2>

                      <p className="text-gray-500 mt-1">
                        Paste the job posting you want to compare your resume
                        against.
                      </p>
                    </div>
                  </div>

                  {/* JOB TITLE */}

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Title{" "}
                      <span className="font-normal text-gray-400">
                        (optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(event) => setJobTitle(event.target.value)}
                      placeholder="e.g. Junior DevOps Engineer"
                      className="w-full border border-gray-200 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                    />
                  </div>

                  {/* COMPANY */}

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company{" "}
                      <span className="font-normal text-gray-400">
                        (optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      placeholder="e.g. Google"
                      className="w-full border border-gray-200 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                    />
                  </div>

                  {/* JOB DESCRIPTION */}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Job Description
                      </label>

                      <span className="text-xs text-gray-400">
                        {jobDescription.length.toLocaleString()} characters
                      </span>
                    </div>

                    <textarea
                      value={jobDescription}
                      onChange={(event) => {
                        if (
                          event.target.value.length <=
                          MAX_JOB_DESCRIPTION_LENGTH
                        ) {
                          setJobDescription(event.target.value);
                        }
                      }}
                      rows={17}
                      placeholder={`Paste the full job description here...

Example:

We are looking for a Junior DevOps Engineer to join our engineering team.

Requirements:
• Experience with AWS
• Knowledge of Docker and Kubernetes
• Familiarity with Terraform
• Strong Linux skills
• Experience with CI/CD
• Good communication and problem-solving skills`}
                      className="w-full border border-gray-200 rounded-xl px-4 py-4 outline-none resize-y focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition text-gray-700 leading-6"
                    />
                  </div>

                  {/* ANALYZE */}

                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!jobDescription.trim()}
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <Search size={18} />
                    Analyze Job Match
                  </button>
                </section>

                {/* RIGHT COLUMN */}

                <aside className="space-y-6">
                  {/* RESUME CARD */}

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                        <FileText size={23} className="text-green-600" />
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900">Your Resume</h3>

                        <p className="text-sm text-green-600 mt-1">
                          Ready to analyze
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-500 mt-5 leading-6">
                      SmartResume will use the resume currently saved in your
                      editor when comparing it with the job description.
                    </p>

                    <Link
                      to="/editor"
                      className="mt-6 block text-center border border-gray-200 rounded-xl py-3 font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      View / Edit Resume
                    </Link>
                  </div>

                  {/* WHAT YOU GET */}

                  <div className="bg-gray-900 rounded-3xl p-7 text-white">
                    <div className="flex items-center gap-3">
                      <Sparkles size={20} className="text-blue-400" />

                      <h3 className="font-bold">What you'll get</h3>
                    </div>

                    <div className="mt-6 space-y-5">
                      <Feature
                        icon={<Target size={18} />}
                        title="Match Score"
                        description="See how closely your resume aligns with the role."
                      />

                      <Feature
                        icon={<Search size={18} />}
                        title="Keywords"
                        description="Identify important skills found or missing."
                      />

                      <Feature
                        icon={<Briefcase size={18} />}
                        title="Experience"
                        description="See how your experience relates to the job."
                      />

                      <Feature
                        icon={<Sparkles size={18} />}
                        title="Recommendations"
                        description="Get practical suggestions for improving your match."
                      />
                    </div>
                  </div>

                  {/* TIP */}

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
                    <div className="text-2xl mb-3">💡</div>

                    <h3 className="font-bold text-gray-900 mb-2">Pro tip</h3>

                    <p className="text-sm text-gray-500 leading-6">
                      Paste the complete job description. Responsibilities,
                      qualifications and preferred skills all provide useful
                      matching signals.
                    </p>
                  </div>
                </aside>
              </div>
            ) : (
              /* =================================================
                 RESULTS
              ================================================= */

              <div>
                {/* RESULTS HEADER */}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
                  <div>
                    <Link
                      to="/dashboard"
                      className="text-sm text-gray-500 hover:text-gray-900"
                    >
                      ← Dashboard
                    </Link>

                    <h2 className="text-2xl font-bold text-gray-900 mt-2">
                      Job Match Results
                    </h2>

                    {(jobTitle || company) && (
                      <p className="text-gray-500 mt-1">
                        {jobTitle}
                        {jobTitle && company ? " · " : ""}
                        {company}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-white transition"
                  >
                    <RotateCcw size={16} />
                    New Match
                  </button>
                </div>

                {/* SCORE */}

                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                  <div className="grid lg:grid-cols-[230px_1fr] gap-10 items-center">
                    <MatchScore score={analysis.overall} />

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-900">
                          Job Match Score
                        </h2>

                        {analysis.category && (
                          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold capitalize">
                            {analysis.category} role
                          </span>
                        )}
                      </div>

                      <p className="text-gray-500 mt-3 leading-7 max-w-2xl">
                        This score compares the job description with your saved
                        resume using detected skills, role terminology,
                        experience relevance and professional requirements.
                      </p>

                      <div className="grid sm:grid-cols-3 gap-4 mt-7">
                        <MatchMini
                          label="Keywords"
                          score={analysis.keywordAnalysis.score}
                        />

                        <MatchMini
                          label="Experience"
                          score={analysis.experienceAnalysis.score}
                        />

                        <MatchMini
                          label="Requirements"
                          score={analysis.requirementAnalysis.score}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* RESULTS GRID */}

                <div className="grid lg:grid-cols-2 gap-6 mt-6">
                  {/* MATCHING SKILLS */}

                  <ResultCard
                    title="Matching Skills"
                    icon={<CheckCircle2 size={21} className="text-green-500" />}
                  >
                    {analysis.keywordAnalysis.matched.length ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywordAnalysis.matched.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No direct skill matches were detected.
                      </p>
                    )}
                  </ResultCard>

                  {/* MISSING SKILLS */}

                  <ResultCard
                    title="Missing Skills"
                    icon={<AlertCircle size={21} className="text-amber-500" />}
                  >
                    {analysis.keywordAnalysis.missing.length ? (
                      <>
                        <p className="text-sm text-gray-500 mb-4">
                          Consider adding these only if you genuinely have the
                          skill or experience.
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {analysis.keywordAnalysis.missing.map((skill) => (
                            <span
                              key={skill}
                              className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-green-600 font-medium">
                        No missing technical skills were detected.
                      </p>
                    )}
                  </ResultCard>

                  {/* TITLE MATCH */}

                  <ResultCard title="Professional Title">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Your title</p>

                        <p className="font-semibold text-gray-900 mt-1">
                          {storedResume.contact.title || "Not provided"}
                        </p>
                      </div>

                      <span className="text-2xl font-bold text-gray-900">
                        {analysis.titleAnalysis.score}%
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mt-5">
                      {analysis.titleAnalysis.reason}
                    </p>
                  </ResultCard>

                  {/* EXPERIENCE */}

                  <ResultCard title="Experience Relevance">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">
                          Relevant experience
                        </p>

                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {analysis.experienceAnalysis.relevantEntries}
                          <span className="text-base font-normal text-gray-400">
                            {" "}
                            / {analysis.experienceAnalysis.totalEntries}
                          </span>
                        </p>
                      </div>

                      <span className="text-2xl font-bold text-gray-900">
                        {analysis.experienceAnalysis.score}%
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mt-5">
                      This measures how much terminology from the job
                      description appears in your experience entries.
                    </p>
                  </ResultCard>

                  {/* REQUIREMENTS */}

                  <ResultCard title="Professional Requirements">
                    {analysis.requirementAnalysis.matched.length ? (
                      <div className="space-y-3">
                        {analysis.requirementAnalysis.matched.map(
                          (requirement) => (
                            <div
                              key={requirement}
                              className="flex items-center gap-3"
                            >
                              <CheckCircle2
                                size={18}
                                className="text-green-500"
                              />

                              <span className="text-gray-700">
                                {requirement}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No additional requirements were matched.
                      </p>
                    )}

                    {analysis.requirementAnalysis.missing.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Not detected
                        </p>

                        <div className="space-y-3">
                          {analysis.requirementAnalysis.missing.map(
                            (requirement) => (
                              <div
                                key={requirement}
                                className="flex items-center gap-3"
                              >
                                <AlertCircle
                                  size={18}
                                  className="text-amber-500"
                                />

                                <span className="text-gray-600">
                                  {requirement}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </ResultCard>

                  {/* RECOMMENDATIONS */}

                  <ResultCard title="Recommendations">
                    <div className="space-y-4">
                      {analysis.keywordAnalysis.missing.length > 0 && (
                        <Recommendation
                          title="Review missing job keywords"
                          text="If you genuinely have these skills, make sure they appear clearly in the appropriate section of your resume."
                        />
                      )}

                      {analysis.titleAnalysis.score < 60 && (
                        <Recommendation
                          title="Align your professional title"
                          text="If appropriate, make your resume title clearer and closer to the role you are applying for."
                        />
                      )}

                      {analysis.experienceAnalysis.score < 60 && (
                        <Recommendation
                          title="Strengthen relevant experience"
                          text="Emphasize experience and achievements that directly demonstrate the capabilities requested in the job description."
                        />
                      )}

                      {analysis.requirementAnalysis.score < 70 && (
                        <Recommendation
                          title="Address job requirements"
                          text="Review the requirements you already satisfy and make that evidence easier for a recruiter to find."
                        />
                      )}

                      {analysis.overall >= 80 && (
                        <Recommendation
                          title="Review your remaining gaps"
                          text="Your resume contains many signals that overlap with this job description. Review the remaining gaps and make sure every claim is accurate and supportable."
                        />
                      )}
                    </div>
                  </ResultCard>
                </div>

                {/* EDIT BUTTON */}

                <div className="mt-8 flex justify-center">
                  <Link
                    to="/editor"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
                  >
                    Review / Edit Resume
                    <ArrowRight size={17} />
                  </Link>
                </div>

                <p className="text-center text-sm text-gray-400 mt-7">
                  Job Match compares your resume with the supplied job
                  description. It does not guarantee hiring outcomes.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

/* =========================================================
   FEATURE
========================================================= */

function Feature({ icon, title, description }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5">{icon}</div>

      <div>
        <p className="font-semibold text-sm">{title}</p>

        <p className="text-gray-400 text-xs leading-5 mt-1">{description}</p>
      </div>
    </div>
  );
}

/* =========================================================
   MATCH SCORE
========================================================= */

function MatchScore({ score }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));

  const getColor = () => {
    if (safeScore >= 80) return "text-green-500";
    if (safeScore >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getLabel = () => {
    if (safeScore >= 80) return "Strong Match";
    if (safeScore >= 60) return "Moderate Match";
    return "Low Match";
  };

  const circumference = 2 * Math.PI * 68;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r="68"
            stroke="currentColor"
            strokeWidth="13"
            fill="transparent"
            className="text-gray-100"
          />

          <circle
            cx="90"
            cy="90"
            r="68"
            stroke="currentColor"
            strokeWidth="13"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (safeScore / 100) * circumference}
            className={`${getColor()} transition-all duration-1000`}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900">{safeScore}</span>

          <span className="text-sm text-gray-500">/ 100</span>
        </div>
      </div>

      <span className={`mt-2 font-semibold ${getColor()}`}>{getLabel()}</span>
    </div>
  );
}

/* =========================================================
   MATCH MINI
========================================================= */

function MatchMini({ label, score }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>

        <span className="font-bold text-gray-900">{safeScore}</span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 rounded-full transition-all"
          style={{
            width: `${safeScore}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   RESULT CARD
========================================================= */

function ResultCard({ title, icon, children }) {
  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
      <div className="flex items-center gap-3 mb-6">
        {icon}

        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   RECOMMENDATION
========================================================= */

function Recommendation({ title, text }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-gray-50">
      <Sparkles size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />

      <div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>

        <p className="text-sm text-gray-500 leading-6 mt-1">{text}</p>
      </div>
    </div>
  );
}

export default JobMatch;
