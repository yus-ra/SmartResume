import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadResume, isEmptyResume } from "../../lib/resumeSchema";
import { Target, FileText, Search } from "lucide-react";

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
    { label: "Master's degree", pattern: /master|m\.?sc|m\.?a\.?/i },
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
    { label: "Leadership", pattern: /leadership|lead a team|mentor|supervis/i },
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
  const navigate = useNavigate();

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const storedResume = useMemo(() => {
    const loaded = loadResume();
    return isEmptyResume(loaded) ? null : loaded;
  }, []);

  const handleAnalyze = () => {
    if (!jobDescription.trim() || !storedResume) return;

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

    const analysis = {
      overallScore: overall,
      category,
      keywordAnalysis,
      titleAnalysis,
      experienceAnalysis,
      requirementAnalysis,
      matchedKeywords: keywordAnalysis.matched,
      missingKeywords: keywordAnalysis.missing,
      recommendations: [
        keywordAnalysis.missing.length > 0
          ? `Add missing keywords: ${keywordAnalysis.missing.slice(0, 5).join(", ")}`
          : "Your resume matches the core required skills well.",
        titleAnalysis.score < 70
          ? "Consider tailoring your professional headline to better match the target job title."
          : "Your professional title aligns well with the position.",
      ],
    };

    navigate("/job-match/results", {
      state: {
        analysis,
        jobTitle,
        company,
        jobDescription,
      },
    });
  };

  const resumeExists = Boolean(storedResume);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="ml-60 min-h-screen">
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

        <main className="px-12 py-10">
          <div className="max-w-[1400px] mx-auto">
            {!resumeExists ? (
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
            ) : (
              <div className="grid xl:grid-cols-[1fr_360px] gap-8">
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
                      placeholder="Paste the full job description here..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-4 outline-none resize-y focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition text-gray-700 leading-6"
                    />
                  </div>

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

                <aside className="space-y-6">
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
                </aside>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobMatch;
