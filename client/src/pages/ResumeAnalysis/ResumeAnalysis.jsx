import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/* =========================================================
   SCORE GAUGE
========================================================= */

function ScoreGauge({ score }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  const getScoreColor = () => {
    if (safeScore >= 85) return "text-green-500";
    if (safeScore >= 70) return "text-amber-500";
    return "text-red-500";
  };

  const getLabel = () => {
    if (safeScore >= 85) return "Excellent";
    if (safeScore >= 70) return "Good";
    if (safeScore >= 55) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="currentColor"
            strokeWidth="14"
            fill="transparent"
            className="text-gray-100"
          />

          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="currentColor"
            strokeWidth="14"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${getScoreColor()} transition-all duration-1000`}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900">{safeScore}</span>
          <span className="text-sm text-gray-500">/ 100</span>
        </div>
      </div>

      <div className={`mt-2 font-semibold ${getScoreColor()}`}>
        {getLabel()}
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^\w\s+#./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const unique = (items) => [...new Set(items.filter(Boolean))];

const countWords = (text = "") =>
  String(text).trim() ? String(text).trim().split(/\s+/).length : 0;

const hasNumber = (text = "") => /\b\d+(?:\.\d+)?%?\b/.test(text);

const hasImpactLanguage = (text = "") =>
  /\b(increased|decreased|reduced|improved|saved|generated|grew|boosted|delivered|achieved|managed|supported|automated|optimized|accelerated|cut|raised|lowered|built|launched)\b/i.test(
    text,
  );

const actionVerbs = [
  "achieved",
  "analyzed",
  "architected",
  "automated",
  "built",
  "collaborated",
  "configured",
  "created",
  "deployed",
  "designed",
  "developed",
  "delivered",
  "engineered",
  "implemented",
  "improved",
  "integrated",
  "launched",
  "led",
  "managed",
  "migrated",
  "optimized",
  "planned",
  "reduced",
  "resolved",
  "streamlined",
  "tested",
  "trained",
  "troubleshot",
  "upgraded",
];

const weakPhrases = [
  "responsible for",
  "worked on",
  "helped with",
  "helped to",
  "duties included",
  "tasked with",
  "involved in",
  "participated in",
  "was responsible",
  "assisted with",
];

const fillerPhrases = [
  "hard working",
  "hardworking",
  "team player",
  "go getter",
  "go-getter",
  "passionate individual",
  "motivated individual",
  "results driven",
  "results-driven",
  "detail oriented",
  "detail-oriented",
  "excellent communication skills",
  "excellent interpersonal skills",
];

/* =========================================================
   ROLE PROFILES
   =========================================================
   Instead of judging every resume against the same keywords,
   SmartResume first tries to understand what kind of resume
   it is looking at.
========================================================= */

const ROLE_PROFILES = {
  software: {
    terms: [
      "software",
      "frontend",
      "front end",
      "backend",
      "back end",
      "full stack",
      "fullstack",
      "web developer",
      "application developer",
      "mobile developer",
      "software engineer",
    ],
    keywords: [
      "javascript",
      "typescript",
      "react",
      "node.js",
      "python",
      "java",
      "git",
      "api",
      "rest",
      "database",
      "sql",
      "testing",
      "github",
    ],
  },

  devops: {
    terms: [
      "devops",
      "cloud",
      "site reliability",
      "sre",
      "platform engineer",
      "cloud engineer",
      "infrastructure",
    ],
    keywords: [
      "aws",
      "azure",
      "gcp",
      "docker",
      "kubernetes",
      "terraform",
      "ansible",
      "ci/cd",
      "jenkins",
      "github actions",
      "linux",
      "monitoring",
      "logging",
      "git",
      "infrastructure",
    ],
  },

  data: {
    terms: [
      "data analyst",
      "data scientist",
      "data engineer",
      "analytics",
      "machine learning",
      "artificial intelligence",
    ],
    keywords: [
      "python",
      "sql",
      "excel",
      "power bi",
      "tableau",
      "pandas",
      "numpy",
      "statistics",
      "machine learning",
      "data visualization",
      "etl",
    ],
  },

  cybersecurity: {
    terms: [
      "cybersecurity",
      "cyber security",
      "security analyst",
      "security engineer",
      "information security",
      "soc analyst",
    ],
    keywords: [
      "siem",
      "network security",
      "firewall",
      "linux",
      "incident response",
      "vulnerability",
      "penetration testing",
      "risk",
      "threat",
      "security",
    ],
  },

  design: {
    terms: [
      "designer",
      "ui designer",
      "ux designer",
      "product designer",
      "graphic designer",
      "visual designer",
    ],
    keywords: [
      "figma",
      "adobe",
      "photoshop",
      "illustrator",
      "user experience",
      "user interface",
      "wireframes",
      "prototyping",
      "design systems",
      "usability",
    ],
  },

  marketing: {
    terms: [
      "marketing",
      "digital marketing",
      "social media",
      "content marketing",
      "brand",
      "communications",
    ],
    keywords: [
      "seo",
      "content",
      "social media",
      "analytics",
      "campaigns",
      "branding",
      "email marketing",
      "copywriting",
      "advertising",
    ],
  },

  finance: {
    terms: [
      "accountant",
      "accounting",
      "finance",
      "financial analyst",
      "auditor",
      "banking",
    ],
    keywords: [
      "excel",
      "financial analysis",
      "accounting",
      "budgeting",
      "forecasting",
      "audit",
      "financial reporting",
      "reconciliation",
    ],
  },

  hr: {
    terms: [
      "human resources",
      "hr",
      "recruiter",
      "talent acquisition",
      "people operations",
    ],
    keywords: [
      "recruitment",
      "onboarding",
      "employee relations",
      "talent acquisition",
      "hris",
      "payroll",
      "performance management",
    ],
  },

  project: {
    terms: [
      "project manager",
      "project management",
      "program manager",
      "scrum master",
      "product manager",
    ],
    keywords: [
      "agile",
      "scrum",
      "jira",
      "stakeholder",
      "project management",
      "roadmap",
      "kanban",
      "planning",
      "delivery",
    ],
  },

  sales: {
    terms: [
      "sales",
      "business development",
      "account executive",
      "sales representative",
      "business development representative",
    ],
    keywords: [
      "sales",
      "lead generation",
      "crm",
      "customer acquisition",
      "negotiation",
      "pipeline",
      "revenue",
      "client relationships",
    ],
  },
};

/* =========================================================
   NORMALIZATION
========================================================= */

function normalizeResume(data) {
  const resume = data || {};

  return {
    contact: {
      name: resume.contact?.name || "",
      title: resume.contact?.title || "",
      email: resume.contact?.email || "",
      phone: resume.contact?.phone || "",
      location: resume.contact?.location || "",
      linkedin: resume.contact?.linkedin || "",
    },

    summary: resume.summary || "",

    experience: Array.isArray(resume.experience)
      ? resume.experience.map((item) => ({
          role: item?.role || "",
          company: item?.company || "",
          period: item?.period || "",
          bullets: Array.isArray(item?.bullets)
            ? item.bullets.filter(Boolean)
            : [],
        }))
      : [],

    education: Array.isArray(resume.education)
      ? resume.education.map((item) => ({
          degree: item?.degree || "",
          school: item?.school || "",
          period: item?.period || "",
        }))
      : [],

    skills: Array.isArray(resume.skills) ? resume.skills.filter(Boolean) : [],
  };
}

/* =========================================================
   ROLE DETECTION
========================================================= */

function detectRole(resume) {
  const source = normalizeText(
    [
      resume.contact.title,
      resume.summary,
      ...resume.skills,
      ...resume.experience.map((item) => item.role),
    ].join(" "),
  );

  let bestRole = null;
  let bestScore = 0;

  Object.entries(ROLE_PROFILES).forEach(([role, profile]) => {
    let score = 0;

    profile.terms.forEach((term) => {
      if (source.includes(normalizeText(term))) {
        score += 3;
      }
    });

    profile.keywords.forEach((keyword) => {
      if (source.includes(normalizeText(keyword))) {
        score += 1;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestRole = role;
    }
  });

  return {
    role: bestRole,
    confidence: Math.min(100, Math.round((bestScore / 12) * 100)),
  };
}

/* =========================================================
   RESUME TEXT
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
   KEYWORD ANALYSIS
========================================================= */

function analyzeKeywords(resume, roleInfo) {
  const text = buildResumeText(resume);

  let keywords = [];

  if (roleInfo.role) {
    keywords = ROLE_PROFILES[roleInfo.role].keywords;
  } else {
    keywords = [
      "communication",
      "leadership",
      "problem solving",
      "project management",
      "teamwork",
      "analysis",
      "research",
      "documentation",
    ];
  }

  const matched = keywords.filter((keyword) =>
    text.includes(normalizeText(keyword)),
  );

  const missing = keywords.filter(
    (keyword) => !text.includes(normalizeText(keyword)),
  );

  const score =
    keywords.length === 0
      ? 100
      : Math.round((matched.length / keywords.length) * 100);

  return {
    matched,
    missing,
    score,
  };
}

/* =========================================================
   CONTACT ANALYSIS
========================================================= */

function analyzeContact(contact) {
  const checks = {
    name: Boolean(contact.name.trim()),
    title: Boolean(contact.title.trim()),
    email: Boolean(contact.email.trim()),
    phone: Boolean(contact.phone.trim()),
    location: Boolean(contact.location.trim()),
    linkedin: Boolean(contact.linkedin.trim()),
  };

  const completed = Object.values(checks).filter(Boolean).length;

  return {
    checks,
    score: Math.round((completed / 6) * 100),
  };
}

/* =========================================================
   EXPERIENCE ANALYSIS
========================================================= */

function analyzeExperience(experience) {
  const bullets = experience.flatMap((item) => item.bullets || []);

  if (!experience.length) {
    return {
      score: 0,
      bulletCount: 0,
      quantified: 0,
      actionVerbBullets: 0,
      impactBullets: 0,
      weakPhraseCount: 0,
      longBullets: 0,
    };
  }

  const quantified = bullets.filter(hasNumber).length;

  const actionVerbBullets = bullets.filter((bullet) => {
    const firstWord = normalizeText(bullet).split(" ")[0];

    return actionVerbs.includes(firstWord);
  }).length;

  const impactBullets = bullets.filter(hasImpactLanguage).length;

  const weakPhraseCount = bullets.filter((bullet) =>
    weakPhrases.some((phrase) =>
      normalizeText(bullet).includes(normalizeText(phrase)),
    ),
  ).length;

  const longBullets = bullets.filter(
    (bullet) => countWords(bullet) > 35,
  ).length;

  const bulletQuality =
    bullets.length === 0
      ? 0
      : Math.round(
          (quantified / bullets.length) * 35 +
            (actionVerbBullets / bullets.length) * 30 +
            (impactBullets / bullets.length) * 25 -
            (weakPhraseCount / bullets.length) * 10,
        );

  const structureScore = Math.min(
    100,
    experience.length * 20 + Math.min(bullets.length * 5, 40),
  );

  return {
    score: Math.max(0, Math.round(bulletQuality * 0.7 + structureScore * 0.3)),
    bulletCount: bullets.length,
    quantified,
    actionVerbBullets,
    impactBullets,
    weakPhraseCount,
    longBullets,
  };
}

/* =========================================================
   SUMMARY ANALYSIS
========================================================= */

function analyzeSummary(summary) {
  const words = countWords(summary);

  if (!words) {
    return {
      score: 0,
      words: 0,
      hasFiller: false,
      hasFirstPerson: false,
    };
  }

  const normalized = normalizeText(summary);

  const hasFiller = fillerPhrases.some((phrase) =>
    normalized.includes(normalizeText(phrase)),
  );

  const hasFirstPerson = /\b(i|me|my|mine|myself)\b/i.test(summary);

  let score = 40;

  if (words >= 30) score += 20;
  if (words >= 50) score += 15;
  if (words <= 20) score -= 15;
  if (words > 100) score -= 15;
  if (hasFiller) score -= 10;
  if (hasFirstPerson) score -= 5;

  return {
    score: Math.max(0, Math.min(100, score)),
    words,
    hasFiller,
    hasFirstPerson,
  };
}

/* =========================================================
   SKILLS ANALYSIS
========================================================= */

function analyzeSkills(skills) {
  const count = skills.length;

  let score = 0;

  if (count >= 8) score = 100;
  else if (count >= 6) score = 90;
  else if (count >= 4) score = 75;
  else if (count >= 2) score = 55;
  else if (count === 1) score = 30;

  return {
    count,
    score,
  };
}

/* =========================================================
   EDUCATION ANALYSIS
========================================================= */

function analyzeEducation(education) {
  if (!education.length) {
    return {
      score: 0,
      complete: 0,
    };
  }

  const complete = education.filter(
    (item) => item.degree.trim() && item.school.trim(),
  ).length;

  return {
    complete,
    score: Math.round((complete / education.length) * 100),
  };
}

/* =========================================================
   READABILITY
========================================================= */

function analyzeReadability(resume) {
  const bullets = resume.experience.flatMap((item) => item.bullets || []);

  if (!bullets.length) {
    return {
      score: 60,
      averageWords: 0,
      longBullets: 0,
    };
  }

  const totalWords = bullets.reduce(
    (total, bullet) => total + countWords(bullet),
    0,
  );

  const averageWords = Math.round(totalWords / bullets.length);

  const longBullets = bullets.filter(
    (bullet) => countWords(bullet) > 35,
  ).length;

  let score = 100;

  if (averageWords > 30) score -= 15;
  if (averageWords > 40) score -= 20;
  if (longBullets > 1) score -= 15;

  return {
    score: Math.max(0, score),
    averageWords,
    longBullets,
  };
}

/* =========================================================
   STRUCTURE ANALYSIS
========================================================= */

function analyzeStructure(resume) {
  const sections = {
    contact: Boolean(resume.contact.name) || Boolean(resume.contact.email),

    summary: Boolean(resume.summary.trim()),

    experience: resume.experience.length > 0,

    education: resume.education.length > 0,

    skills: resume.skills.length > 0,
  };

  const completed = Object.values(sections).filter(Boolean).length;

  return {
    sections,
    score: Math.round((completed / Object.keys(sections).length) * 100),
  };
}

/* =========================================================
   OVERALL SCORE
========================================================= */

function calculateOverall(scores) {
  return Math.round(
    scores.contact * 0.1 +
      scores.structure * 0.1 +
      scores.summary * 0.15 +
      scores.experience * 0.2 +
      scores.achievement * 0.15 +
      scores.skills * 0.1 +
      scores.education * 0.05 +
      scores.keywords * 0.1 +
      scores.readability * 0.05,
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ResumeAnalysis() {
  const [resume, setResume] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const stored =
      localStorage.getItem("resumeData") || localStorage.getItem("cvData");

    if (stored) {
      try {
        setResume(normalizeResume(JSON.parse(stored)));
      } catch (error) {
        console.error("Could not read resume data:", error);
      }
    }
  }, []);

  /* =======================================================
     ANALYSIS
  ======================================================= */

  const analysis = useMemo(() => {
    if (!resume) return null;

    const roleInfo = detectRole(resume);

    const contact = analyzeContact(resume.contact);

    const structure = analyzeStructure(resume);

    const summary = analyzeSummary(resume.summary);

    const experience = analyzeExperience(resume.experience);

    const skills = analyzeSkills(resume.skills);

    const education = analyzeEducation(resume.education);

    const readability = analyzeReadability(resume);

    const keywordAnalysis = analyzeKeywords(resume, roleInfo);

    const scores = {
      contact: contact.score,
      structure: structure.score,
      summary: summary.score,
      experience: experience.score,
      achievement:
        experience.bulletCount === 0
          ? 0
          : Math.round(
              ((experience.quantified / experience.bulletCount) * 100 +
                (experience.impactBullets / experience.bulletCount) * 100) /
                2,
            ),
      skills: skills.score,
      education: education.score,
      keywords: keywordAnalysis.score,
      readability: readability.score,
    };

    const overall = calculateOverall(scores);

    return {
      roleInfo,
      contact,
      structure,
      summary,
      experience,
      skills,
      education,
      readability,
      keywordAnalysis,
      scores,
      overall,
    };
  }, [resume]);

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-5">📄</div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Resume Found
          </h2>

          <p className="text-gray-500 mb-6">
            Create or import a resume before running the analysis.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to="/editor"
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
            >
              Create Resume
            </Link>

            <Link
              to="/import-resume"
              className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Import Resume
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     SUGGESTIONS
  ======================================================= */

  const suggestions = [];

  if (analysis.scores.contact < 100) {
    suggestions.push({
      section: "Contact",
      title: "Complete your contact information",
      description:
        "Make sure your name, professional title, email, phone number, location and LinkedIn profile are included where relevant.",
    });
  }

  if (analysis.summary.score < 70) {
    if (!resume.summary.trim()) {
      suggestions.push({
        section: "Summary",
        title: "Add a professional summary",
        description:
          "Introduce who you are, your strongest skills and the type of value you can bring to an employer.",
      });
    } else {
      suggestions.push({
        section: "Summary",
        title: "Strengthen your professional summary",
        description:
          "Aim for a concise summary that communicates your role, strongest capabilities and career direction rather than generic statements.",
      });
    }
  }

  if (analysis.experience.bulletCount === 0) {
    suggestions.push({
      section: "Experience",
      title: "Add experience details",
      description:
        "Describe your work, internship, volunteer or project experience using concise achievement-focused bullet points.",
    });
  }

  if (
    analysis.experience.bulletCount > 0 &&
    analysis.experience.quantified <
      Math.max(1, Math.ceil(analysis.experience.bulletCount * 0.3))
  ) {
    suggestions.push({
      section: "Experience",
      title: "Add measurable achievements",
      description:
        "Where possible, show scale or impact using numbers, percentages, time saved, users supported, projects completed or other measurable outcomes.",
    });
  }

  if (analysis.experience.weakPhraseCount > 0) {
    suggestions.push({
      section: "Experience",
      title: "Replace weak phrases with stronger action verbs",
      description:
        "Phrases such as 'responsible for' and 'worked on' describe duties but do not show your contribution clearly. Start bullets with strong action verbs.",
    });
  }

  if (analysis.experience.longBullets > 0) {
    suggestions.push({
      section: "Experience",
      title: "Shorten lengthy bullet points",
      description:
        "Break long descriptions into focused bullets so recruiters can quickly identify your contribution and results.",
    });
  }

  if (analysis.skills.count < 5) {
    suggestions.push({
      section: "Skills",
      title: "Expand your skills section",
      description:
        "Include relevant technical, professional and tool-based skills that you can genuinely demonstrate.",
    });
  }

  if (analysis.education.score < 100) {
    suggestions.push({
      section: "Education",
      title: "Complete your education details",
      description:
        "Include the qualification, institution and relevant dates where appropriate.",
    });
  }

  if (analysis.keywordAnalysis.missing.length > 0) {
    suggestions.push({
      section: "Skills",
      title: "Consider adding relevant role keywords",
      description: `Your resume may benefit from relevant terms such as ${analysis.keywordAnalysis.missing
        .slice(0, 5)
        .join(", ")} if they genuinely match your experience.`,
    });
  }

  if (analysis.readability.score < 80) {
    suggestions.push({
      section: "Experience",
      title: "Improve readability",
      description:
        "Keep experience bullets concise, specific and easy to scan. Avoid packing multiple ideas into one sentence.",
    });
  }

  const strengths = [];

  if (analysis.scores.contact >= 85) {
    strengths.push("Your contact information is well structured.");
  }

  if (analysis.scores.summary >= 80) {
    strengths.push("Your professional summary is strong.");
  }

  if (analysis.experience.actionVerbBullets > 0) {
    strengths.push("Your experience uses action-oriented language.");
  }

  if (analysis.experience.quantified > 0) {
    strengths.push("You have included measurable results.");
  }

  if (analysis.skills.count >= 6) {
    strengths.push("Your skills section contains a useful range of skills.");
  }

  if (analysis.keywordAnalysis.matched.length >= 3) {
    strengths.push("Your resume contains relevant role-specific keywords.");
  }

  /* =======================================================
     FIX HANDLER
  ======================================================= */

  const handleFix = (section) => {
    localStorage.setItem("activeResumeSection", section);
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <Link
              to="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              ← Dashboard
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Resume Analysis
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              Understand how strong your resume is and where you can improve it.
            </p>
          </div>

          <Link
            to="/editor"
            className="bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
          >
            Edit Resume
          </Link>
        </div>
      </header>

      {/* Main */}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Score Card */}

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8">
          <div className="grid lg:grid-cols-[240px_1fr] gap-10 items-center">
            <ScoreGauge score={analysis.overall} />

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  Resume Score
                </h2>

                {analysis.roleInfo.role && (
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold capitalize">
                    {analysis.roleInfo.role} profile
                  </span>
                )}
              </div>

              <p className="text-gray-600 leading-7 max-w-2xl">
                Your score is based on resume structure, contact information,
                summary quality, experience, achievements, skills, education,
                relevant keywords and readability.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mt-7">
                <ScoreMini
                  label="Experience"
                  score={analysis.scores.experience}
                />

                <ScoreMini label="Keywords" score={analysis.scores.keywords} />

                <ScoreMini
                  label="Readability"
                  score={analysis.scores.readability}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}

        <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 mb-6 w-fit">
          {[
            ["overview", "Overview"],
            ["keywords", "Keywords"],
            ["suggestions", "Suggestions"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* =================================================
            OVERVIEW TAB
        ================================================= */}

        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <AnalysisCard
              title="Resume Structure"
              score={analysis.scores.structure}
            >
              <AnalysisRow
                label="Contact"
                value={analysis.structure.sections.contact}
              />

              <AnalysisRow
                label="Summary"
                value={analysis.structure.sections.summary}
              />

              <AnalysisRow
                label="Experience"
                value={analysis.structure.sections.experience}
              />

              <AnalysisRow
                label="Education"
                value={analysis.structure.sections.education}
              />

              <AnalysisRow
                label="Skills"
                value={analysis.structure.sections.skills}
              />
            </AnalysisCard>

            <AnalysisCard
              title="Contact Information"
              score={analysis.scores.contact}
            >
              <AnalysisRow label="Name" value={analysis.contact.checks.name} />

              <AnalysisRow
                label="Professional Title"
                value={analysis.contact.checks.title}
              />

              <AnalysisRow
                label="Email"
                value={analysis.contact.checks.email}
              />

              <AnalysisRow
                label="Phone"
                value={analysis.contact.checks.phone}
              />

              <AnalysisRow
                label="Location"
                value={analysis.contact.checks.location}
              />

              <AnalysisRow
                label="LinkedIn"
                value={analysis.contact.checks.linkedin}
              />
            </AnalysisCard>

            <AnalysisCard
              title="Experience Quality"
              score={analysis.scores.experience}
            >
              <StatRow
                label="Experience entries"
                value={resume.experience.length}
              />

              <StatRow
                label="Total bullets"
                value={analysis.experience.bulletCount}
              />

              <StatRow
                label="Bullets with numbers"
                value={analysis.experience.quantified}
              />

              <StatRow
                label="Action-oriented bullets"
                value={analysis.experience.actionVerbBullets}
              />

              <StatRow
                label="Impact-focused bullets"
                value={analysis.experience.impactBullets}
              />
            </AnalysisCard>

            <AnalysisCard
              title="Professional Summary"
              score={analysis.scores.summary}
            >
              <p className="text-gray-600 leading-7">
                {resume.summary ||
                  "No professional summary has been added yet."}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <InfoBadge label={`${analysis.summary.words} words`} />

                {analysis.summary.hasFiller && (
                  <InfoBadge label="Contains generic phrases" />
                )}

                {analysis.summary.hasFirstPerson && (
                  <InfoBadge label="Uses first-person language" />
                )}
              </div>
            </AnalysisCard>

            <AnalysisCard title="Skills" score={analysis.scores.skills}>
              <div className="flex flex-wrap gap-2">
                {resume.skills.length ? (
                  resume.skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No skills added yet.</p>
                )}
              </div>
            </AnalysisCard>

            <AnalysisCard title="Strengths" score={null}>
              {strengths.length ? (
                <div className="space-y-3">
                  {strengths.map((strength, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="text-green-500">✓</span>

                      <p className="text-gray-600">{strength}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  Keep improving your resume to build stronger strengths.
                </p>
              )}
            </AnalysisCard>
          </div>
        )}

        {/* =================================================
            KEYWORDS TAB
        ================================================= */}

        {activeTab === "keywords" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Relevant Keywords
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Based on your resume's apparent role.
                  </p>
                </div>

                <span className="text-2xl font-bold text-gray-900">
                  {analysis.scores.keywords}%
                </span>
              </div>

              {analysis.keywordAnalysis.matched.length ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordAnalysis.matched.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium"
                    >
                      ✓ {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No strong role-specific keywords were detected.
                </p>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-7">
              <h2 className="text-xl font-bold text-gray-900">
                Keywords You May Be Missing
              </h2>

              <p className="text-sm text-gray-500 mt-1 mb-5">
                Only add these when they genuinely describe your skills or
                experience.
              </p>

              {analysis.keywordAnalysis.missing.length ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordAnalysis.missing.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-green-600 font-medium">
                  Great! Your resume covers the detected role keywords.
                </p>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            SUGGESTIONS TAB
        ================================================= */}

        {activeTab === "suggestions" && (
          <div className="space-y-4">
            {suggestions.length ? (
              suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start justify-between gap-6"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                      💡
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-gray-900">
                          {suggestion.title}
                        </h3>

                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                          {suggestion.section}
                        </span>
                      </div>

                      <p className="text-gray-500 mt-2 leading-6">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/editor"
                    onClick={() => handleFix(suggestion.section)}
                    className="text-sm font-semibold text-gray-900 whitespace-nowrap hover:underline"
                  >
                    Fix →
                  </Link>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
                <div className="text-5xl mb-4">🎉</div>

                <h2 className="text-2xl font-bold text-gray-900">
                  Your resume looks strong!
                </h2>

                <p className="text-gray-500 mt-2">
                  No major issues were detected.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}

        <div className="mt-8 text-center text-sm text-gray-400">
          SmartResume analyzes resume structure and content patterns.
          Recommendations are intended to help you improve your resume, not
          guarantee hiring outcomes.
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function ScoreMini({ label, score }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>

        <span className="font-bold text-gray-900">{score}</span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 rounded-full transition-all"
          style={{
            width: `${Math.max(0, Math.min(100, score))}%`,
          }}
        />
      </div>
    </div>
  );
}

function AnalysisCard({ title, score, children }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-7">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>

        {score !== null && score !== undefined && (
          <span className="font-bold text-gray-900">{score}/100</span>
        )}
      </div>

      {children}
    </div>
  );
}

function AnalysisRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>

      <span
        className={`font-semibold ${value ? "text-green-500" : "text-red-400"}`}
      >
        {value ? "✓" : "Missing"}
      </span>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>

      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}

function InfoBadge({ label }) {
  return (
    <span className="px-3 py-2 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
      {label}
    </span>
  );
}
