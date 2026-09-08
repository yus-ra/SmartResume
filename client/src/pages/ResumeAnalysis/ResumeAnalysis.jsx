import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Navbar/Sidebar";

// ========================================
// SCORE GAUGE COMPONENT
// ========================================

function ScoreGauge({ score }) {
  const r = 64;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  const color = score >= 85 ? "#22C55E" : score >= 70 ? "#F59E0B" : "#EF4444";

  const label =
    score >= 85
      ? "Excellent"
      : score >= 70
        ? "Good"
        : score >= 50
          ? "Fair"
          : "Needs Work";

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Background Circle */}
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="10"
        />

        {/* Score Circle */}
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          style={{
            transition: "stroke-dasharray 1s ease",
          }}
        />

        <text
          x="80"
          y="74"
          textAnchor="middle"
          fontSize="30"
          fontWeight="800"
          fill="#0F172A"
          fontFamily="Poppins,sans-serif"
        >
          {score}
        </text>

        <text
          x="80"
          y="94"
          textAnchor="middle"
          fontSize="11"
          fill="#94A3B8"
          fontFamily="Poppins,sans-serif"
        >
          ATS Score
        </text>
      </svg>

      <div className="text-sm font-bold mt-1" style={{ color }}>
        {label}
      </div>
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

const ResumeAnalysis = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const handleFix = (section) => {
    if (section) {
      localStorage.setItem("activeResumeSection", section);
    }
  };

  // ========================================
  // LOAD RESUME
  // ========================================

  const [resume] = useState(() => {
    try {
      const savedResume = localStorage.getItem("resumeData");
      return savedResume ? JSON.parse(savedResume) : null;
    } catch (error) {
      console.error("Failed to load resume:", error);
      return null;
    }
  });

  // ========================================
  // EMPTY STATE
  // ========================================

  if (!resume) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar />

        <main className="flex-1 md:ml-60 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">📄</div>

            <h1 className="text-xl font-bold text-[#0F172A]">
              No Resume Found
            </h1>

            <p className="text-sm text-[#64748B] mt-2">
              Create and save your resume before running an analysis.
            </p>

            <Link
              to="/editor"
              className="inline-block mt-5 bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] transition"
            >
              Create Resume
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ========================================
  // SAFETY FALLBACKS
  // ========================================

  const contact = resume.contact || {};
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const education = Array.isArray(resume.education) ? resume.education : [];
  const skills = Array.isArray(resume.skills) ? resume.skills : [];
  const summary = resume.summary || "";

  // ========================================
  // BUILD RESUME TEXT
  // ========================================

  const resumeText = [
    contact.name || "",
    contact.title || "",
    contact.email || "",
    contact.phone || "",
    contact.location || "",
    contact.linkedin || "",
    summary,

    ...experience.flatMap((item) => [
      item.role || "",
      item.company || "",
      item.period || "",
      ...(Array.isArray(item.bullets) ? item.bullets : []),
    ]),

    ...education.flatMap((item) => [
      item.degree || "",
      item.school || "",
      item.period || "",
    ]),

    ...skills,
  ]
    .join(" ")
    .toLowerCase();

  // ========================================
  // KEYWORD ANALYSIS
  // ========================================

  const targetKeywords = [
    "React",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "Python",
    "AWS",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Terraform",
    "Git",
    "REST API",
    "GraphQL",
    "PostgreSQL",
    "Agile",
    "Microservices",
  ];

  const keywords = targetKeywords.map((word) => ({
    word,
    found: resumeText.includes(word.toLowerCase()),
  }));

  const foundKeywords = keywords.filter((keyword) => keyword.found);
  const missingKeywords = keywords.filter((keyword) => !keyword.found);

  const keywordScore = Math.round(
    (foundKeywords.length / targetKeywords.length) * 100,
  );

  // ========================================
  // CONTACT ANALYSIS
  // ========================================

  const contactFields = [
    contact.name,
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin,
  ];

  const completedContactFields = contactFields.filter(
    (field) => field && typeof field === "string" && field.trim() !== "",
  ).length;

  const contactScore = Math.round(
    (completedContactFields / contactFields.length) * 100,
  );

  // ========================================
  // EXPERIENCE ANALYSIS
  // ========================================

  const allBullets = experience.flatMap((item) =>
    Array.isArray(item.bullets) ? item.bullets : [],
  );

  const experienceCount = experience.length;

  // ========================================
  // QUANTIFIED ACHIEVEMENTS
  // ========================================

  const quantifiedBullets = allBullets.filter(
    (bullet) => typeof bullet === "string" && /\d/.test(bullet),
  );

  const achievementScore =
    allBullets.length > 0
      ? Math.round((quantifiedBullets.length / allBullets.length) * 100)
      : 0;

  // ========================================
  // WEAK ACTION VERBS
  // ========================================

  const weakPhrases = [
    "responsible for",
    "worked on",
    "helped with",
    "tasked with",
    "in charge of",
    "participated in",
    "involved in",
  ];

  const weakPhrasesFound = weakPhrases.filter((phrase) =>
    resumeText.includes(phrase),
  );

  // ========================================
  // SUMMARY ANALYSIS
  // ========================================

  let summaryScore = 0;

  if (summary.length >= 150) {
    summaryScore = 100;
  } else if (summary.length >= 100) {
    summaryScore = 85;
  } else if (summary.length >= 60) {
    summaryScore = 65;
  } else if (summary.length > 0) {
    summaryScore = 35;
  }

  // ========================================
  // SKILLS ANALYSIS
  // ========================================

  let skillsScore = 0;

  if (skills.length >= 10) {
    skillsScore = 100;
  } else if (skills.length >= 8) {
    skillsScore = 85;
  } else if (skills.length >= 5) {
    skillsScore = 65;
  } else if (skills.length > 0) {
    skillsScore = 40;
  }

  // ========================================
  // SCORE CALCULATION
  // ========================================

  let score = 0;

  // Contact = 15
  score += Math.round((contactScore / 100) * 15);

  // Summary = 15
  score += Math.round((summaryScore / 100) * 15);

  // Experience = 20
  if (experienceCount >= 3) {
    score += 20;
  } else if (experienceCount === 2) {
    score += 17;
  } else if (experienceCount === 1) {
    score += 12;
  }

  // Skills = 10
  score += Math.round((skillsScore / 100) * 10);

  // Education = 10
  if (education.length >= 2) {
    score += 10;
  } else if (education.length === 1) {
    score += 8;
  }

  // Keywords = 15
  score += Math.round((keywordScore / 100) * 15);

  // Achievements = 15
  score += Math.round((achievementScore / 100) * 15);

  score = Math.min(score, 100);

  // ========================================
  // SUGGESTIONS
  // ========================================

  const suggestions = [];

  if (missingKeywords.length > 0) {
    suggestions.push({
      type: "error",
      icon: "⚠️",
      label: "Missing Keywords",
      section: "Skills",
      desc: `Consider adding relevant keywords such as ${missingKeywords
        .slice(0, 4)
        .map((keyword) => `'${keyword.word}'`)
        .join(", ")} where they accurately reflect your skills and experience.`,
      points: `+${Math.min(missingKeywords.length * 2, 10)} pts`,
      color: "#EF4444",
      bg: "#FEF2F2",
    });
  }

  if (weakPhrasesFound.length > 0) {
    suggestions.push({
      type: "warning",
      icon: "💡",
      label: "Weak Action Verbs",
      section: "Experience",
      desc: `Replace phrases like "${weakPhrasesFound[0]}" with stronger action verbs such as "Led", "Built", "Developed", or "Delivered".`,
      points: "+4 pts",
      color: "#F59E0B",
      bg: "#FFFBEB",
    });
  }

  if (
    allBullets.length > 0 &&
    quantifiedBullets.length < Math.ceil(allBullets.length / 2)
  ) {
    suggestions.push({
      type: "warning",
      icon: "📊",
      label: "Add Measurable Results",
      section: "Experience",
      desc: `Only ${quantifiedBullets.length} of ${allBullets.length} achievement bullets contain measurable results. Add numbers, percentages, or measurable outcomes where possible.`,
      points: "+5 pts",
      color: "#F59E0B",
      bg: "#FFFBEB",
    });
  }

  if (completedContactFields < 5) {
    suggestions.push({
      type: "warning",
      icon: "📧",
      label: "Contact Info Incomplete",
      section: "Contact",
      desc: `${5 - completedContactFields} contact field${
        5 - completedContactFields > 1 ? "s are" : " is"
      } missing. Complete your contact information to make it easier for recruiters to reach you.`,
      points: "+3 pts",
      color: "#F59E0B",
      bg: "#FFFBEB",
    });
  }

  if (!summary || summary.length < 80) {
    suggestions.push({
      type: "info",
      icon: "📝",
      label: "Improve Professional Summary",
      section: "Summary",
      desc: "Add a stronger professional summary highlighting your experience, key skills, and the value you bring to employers.",
      points: "+5 pts",
      color: "#2563EB",
      bg: "#EFF6FF",
    });
  }

  if (experienceCount === 0) {
    suggestions.push({
      type: "error",
      icon: "💼",
      label: "No Experience Added",
      section: "Experience",
      desc: "Add relevant work experience, internships, volunteer roles, or personal projects to strengthen your resume.",
      points: "+10 pts",
      color: "#EF4444",
      bg: "#FEF2F2",
    });
  }

  if (skills.length < 5) {
    suggestions.push({
      type: "info",
      icon: "🛠️",
      label: "Expand Your Skills",
      section: "Skills",
      desc: "Add more relevant technical or professional skills that accurately represent your capabilities.",
      points: "+4 pts",
      color: "#2563EB",
      bg: "#EFF6FF",
    });
  }

  // ========================================
  // STRENGTHS
  // ========================================

  if (
    allBullets.length > 0 &&
    quantifiedBullets.length >= Math.ceil(allBullets.length / 2)
  ) {
    suggestions.push({
      type: "success",
      icon: "✅",
      label: "Quantified Achievements",
      section: "Experience",
      desc: `Great job! ${quantifiedBullets.length} of ${allBullets.length} achievement bullets contain measurable results.`,
      points: "Good",
      color: "#22C55E",
      bg: "#F0FDF4",
    });
  }

  if (skills.length >= 8) {
    suggestions.push({
      type: "success",
      icon: "🎯",
      label: "Strong Skills Section",
      section: "Skills",
      desc: `Your resume contains ${skills.length} skills, giving recruiters a clear overview of your capabilities.`,
      points: "Strong",
      color: "#22C55E",
      bg: "#F0FDF4",
    });
  }

  if (completedContactFields === 5) {
    suggestions.push({
      type: "success",
      icon: "📇",
      label: "Complete Contact Information",
      section: "Contact",
      desc: "Your essential contact information is complete and easy for recruiters to access.",
      points: "Complete",
      color: "#22C55E",
      bg: "#F0FDF4",
    });
  }

  if (summary.length >= 100) {
    suggestions.push({
      type: "success",
      icon: "✨",
      label: "Strong Professional Summary",
      section: "Summary",
      desc: "Your professional summary provides a clear introduction to your background and professional value.",
      points: "Strong",
      color: "#22C55E",
      bg: "#F0FDF4",
    });
  }

  const issuesFound = suggestions.filter(
    (item) =>
      item.type === "error" || item.type === "warning" || item.type === "info",
  ).length;

  const potentialGain = Math.max(0, 100 - score);

  return (
    <div
      className="flex min-h-screen bg-[#F8FAFC]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <Sidebar />

      <main className="flex-1 md:ml-60 p-6 md:p-10">
        {/* HEADER */}

        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/dashboard"
              className="text-xs text-[#94A3B8] hover:text-[#475569]"
            >
              ← Dashboard
            </Link>

            <h1 className="font-extrabold text-[#0F172A] text-2xl mt-1">
              Resume Analysis 🤖
            </h1>

            <p className="text-[#94A3B8] text-sm">
              {contact.title || "Professional"} Resume · Analyzed just now
            </p>
          </div>

          <Link
            to="/editor"
            className="hidden md:flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            style={{
              background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
            }}
          >
            ✏ Edit Resume
          </Link>
        </div>

        {/* SCORE */}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col items-center">
            <ScoreGauge score={score} />

            <div className="w-full mt-5 flex flex-col gap-3">
              {[
                {
                  label: "Keywords",
                  val: keywordScore,
                  color: "#2563EB",
                },
                {
                  label: "Contact",
                  val: contactScore,
                  color: "#22C55E",
                },
                {
                  label: "Summary",
                  val: summaryScore,
                  color: "#14B8A6",
                },
                {
                  label: "Achievements",
                  val: achievementScore,
                  color: "#F59E0B",
                },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-[#475569] mb-1">
                    <span>{label}</span>

                    <span className="font-semibold" style={{ color }}>
                      {val}%
                    </span>
                  </div>

                  <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${val}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STATS */}

          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {[
              {
                label: "Keywords Found",
                val: `${foundKeywords.length}/${targetKeywords.length}`,
                icon: "🔑",
                color: "#2563EB",
                bg: "#EFF6FF",
                sub: `${missingKeywords.length} missing`,
              },
              {
                label: "Potential Gain",
                val: `+${potentialGain} pts`,
                icon: "📈",
                color: "#22C55E",
                bg: "#F0FDF4",
                sub:
                  potentialGain === 0
                    ? "Excellent score"
                    : "Improve resume sections",
              },
              {
                label: "Issues Found",
                val: issuesFound,
                icon: "⚠️",
                color: "#F59E0B",
                bg: "#FFFBEB",
                sub: issuesFound === 0 ? "Looking great!" : "Areas to improve",
              },
              {
                label: "Contact Score",
                val: `${contactScore}%`,
                icon: "📇",
                color: "#14B8A6",
                bg: "#F0FDFA",
                sub: "Profile completeness",
              },
            ].map(({ label, val, icon, color, bg, sub }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                  style={{ backgroundColor: bg }}
                >
                  {icon}
                </div>

                <div className="font-extrabold text-[#0F172A] text-xl">
                  {val}
                </div>

                <div className="text-xs text-[#94A3B8] mt-0.5">{label}</div>

                <div className="text-[10px] font-medium mt-1" style={{ color }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TABS */}

        <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 mb-6 w-fit">
          {["overview", "keywords", "suggestions"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-lg text-xs font-semibold capitalize"
              style={{
                backgroundColor: activeTab === tab ? "white" : "transparent",
                color: activeTab === tab ? "#0F172A" : "#94A3B8",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}

        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-4">
            {suggestions.length > 0 ? (
              suggestions
                .slice(0, 6)
                .map(({ icon, label, desc, points, color, bg }) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex gap-4"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: bg }}
                    >
                      {icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-bold text-[#0F172A] text-sm">
                          {label}
                        </div>

                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            color,
                            backgroundColor: bg,
                          }}
                        >
                          {points}
                        </span>
                      </div>

                      <p className="text-xs text-[#475569] leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="md:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="font-bold text-[#0F172A]">
                  Your resume looks great!
                </h3>
                <p className="text-sm text-[#64748B] mt-2">
                  No major improvement areas were detected.
                </p>
              </div>
            )}
          </div>
        )}

        {/* KEYWORDS */}

        {activeTab === "keywords" && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
            <h3 className="font-bold text-[#0F172A] text-sm mb-1">
              Keyword Analysis
            </h3>

            <p className="text-xs text-[#94A3B8] mb-5">
              Analysis based on common industry keywords and resume best
              practices.
            </p>

            <div className="flex flex-wrap gap-2">
              {keywords.map(({ word, found }) => (
                <div
                  key={word}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border"
                  style={{
                    borderColor: found ? "#22C55E40" : "#EF444440",
                    backgroundColor: found ? "#F0FDF4" : "#FEF2F2",
                    color: found ? "#22C55E" : "#EF4444",
                  }}
                >
                  <span>{found ? "✓" : "✕"}</span>
                  {word}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUGGESTIONS */}

        {activeTab === "suggestions" && (
          <div className="flex flex-col gap-3">
            {suggestions
              .filter((item) => item.type !== "success")
              .map(({ icon, label, desc, points, color, bg, section }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex gap-4 items-start"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: bg }}
                  >
                    {icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-[#0F172A] text-sm">
                        {label}
                      </div>

                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{
                          color,
                          backgroundColor: bg,
                        }}
                      >
                        {points}
                      </span>
                    </div>

                    <p className="text-xs text-[#475569] leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  <Link
                    to="/editor"
                    onClick={() => handleFix(section)}
                    className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-3 py-1.5 rounded-lg hover:bg-[#DBEAFE] transition-colors flex-shrink-0 self-center"
                  >
                    Fix →
                  </Link>
                </div>
              ))}

            {issuesFound === 0 && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center">
                <div className="text-4xl mb-3">🎉</div>

                <h3 className="font-bold text-[#0F172A]">
                  No major issues found!
                </h3>

                <p className="text-sm text-[#64748B] mt-2">
                  Your resume meets the main quality checks.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ResumeAnalysis;
