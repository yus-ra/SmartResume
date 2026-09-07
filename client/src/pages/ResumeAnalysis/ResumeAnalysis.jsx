import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Navbar/Sidebar";

const ResumeAnalysis = () => {
  const [resume] = useState(() => {
    const savedResume = localStorage.getItem("resumeData");

    return savedResume ? JSON.parse(savedResume) : null;
  });

  if (!resume) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar />

        <main className="flex-1 md:ml-60 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#0F172A]">
              No Resume Found
            </h1>

            <p className="text-sm text-[#64748B] mt-2">
              Create and save your resume before analyzing it.
            </p>

            <Link
              to="/editor"
              className="inline-block mt-5 bg-[#2563EB] text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              Create Resume
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ANALYSIS LOGIC

  const calculateScore = () => {
    let score = 0;

    // Contact Information
    const contactFields = [
      resume.contact.name,
      resume.contact.email,
      resume.contact.phone,
      resume.contact.location,
      resume.contact.linkedin,
    ];

    const completedContactFields = contactFields.filter(
      (field) => field && field.trim() !== "",
    ).length;

    score += completedContactFields * 4;

    // Summary
    if (resume.summary && resume.summary.length > 50) {
      score += 15;
    }

    // Experience
    if (resume.experience.length > 0) {
      score += 20;
    }

    // Skills
    if (resume.skills.length >= 5) {
      score += 15;
    }

    // Education
    if (resume.education.length > 0) {
      score += 10;
    }

    return Math.min(score, 100);
  };

  const score = calculateScore();

  const getScoreLabel = () => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Needs Improvement";

    return "Needs Work";
  };

  const getScoreColor = () => {
    if (score >= 85) return "#10B981";
    if (score >= 70) return "#2563EB";
    if (score >= 50) return "#F59E0B";

    return "#EF4444";
  };

  // SUGGESTIONS

  const suggestions = [];

  if (!resume.contact.email) {
    suggestions.push("Add a professional email address.");
  }

  if (!resume.contact.phone) {
    suggestions.push("Add your phone number.");
  }

  if (!resume.contact.linkedin) {
    suggestions.push("Add your LinkedIn profile.");
  }

  if (!resume.summary || resume.summary.length < 50) {
    suggestions.push(
      "Add a stronger professional summary highlighting your skills and experience.",
    );
  }

  if (resume.skills.length < 5) {
    suggestions.push("Add more relevant skills to strengthen your resume.");
  }

  if (resume.experience.length < 2) {
    suggestions.push(
      "Consider adding more work, internship, volunteer, or project experience.",
    );
  }

  const strengths = [];

  if (resume.summary && resume.summary.length > 50) {
    strengths.push("You have a professional summary.");
  }

  if (resume.skills.length >= 5) {
    strengths.push("You have a strong skills section.");
  }

  if (resume.experience.length > 0) {
    strengths.push("You included work experience.");
  }

  if (resume.education.length > 0) {
    strengths.push("You included your educational background.");
  }

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
            <Link to="/editor" className="text-sm text-[#2563EB] font-medium">
              ← Back to Editor
            </Link>

            <h1 className="text-2xl font-bold text-[#0F172A] mt-3">
              Resume Analysis
            </h1>

            <p className="text-sm text-[#64748B] mt-1">
              See how strong your resume is and discover ways to improve it.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-[#64748B]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            Analysis Complete
          </div>
        </div>

        {/* SCORE CARD */}

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* SCORE CIRCLE */}

            <div
              className="w-36 h-36 rounded-full flex flex-col items-center justify-center border-[10px]"
              style={{
                borderColor: getScoreColor(),
              }}
            >
              <div
                className="text-4xl font-bold"
                style={{
                  color: getScoreColor(),
                }}
              >
                {score}
              </div>

              <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">
                Resume Score
              </div>
            </div>

            {/* SCORE TEXT */}

            <div>
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: getScoreColor() + "15",
                  color: getScoreColor(),
                }}
              >
                {getScoreLabel()}
              </div>

              <h2 className="text-xl font-bold text-[#0F172A] mt-3">
                Your resume scored {score}/100
              </h2>

              <p className="text-sm text-[#64748B] mt-2 max-w-xl leading-relaxed">
                This score is based on the completeness of important resume
                sections such as contact information, professional summary,
                experience, education, and skills.
              </p>
            </div>
          </div>
        </div>

        {/* ANALYSIS GRID */}

        <div className="grid md:grid-cols-2 gap-6">
          {/* STRENGTHS */}

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center">
                💪
              </div>

              <div>
                <h2 className="font-bold text-[#0F172A]">Resume Strengths</h2>

                <p className="text-xs text-[#94A3B8]">
                  Things you're doing well
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {strengths.length > 0 ? (
                strengths.map((strength, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 bg-[#F8FAFC] rounded-xl p-3"
                  >
                    <span className="text-[#10B981]">✓</span>

                    <p className="text-sm text-[#475569]">{strength}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#94A3B8]">
                  Add more information to your resume to identify strengths.
                </p>
              )}
            </div>
          </div>

          {/* IMPROVEMENTS */}

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] flex items-center justify-center">
                💡
              </div>

              <div>
                <h2 className="font-bold text-[#0F172A]">Suggestions</h2>

                <p className="text-xs text-[#94A3B8]">Areas you can improve</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 bg-[#F8FAFC] rounded-xl p-3"
                  >
                    <span className="text-[#F59E0B]">⚠</span>

                    <p className="text-sm text-[#475569]">{suggestion}</p>
                  </div>
                ))
              ) : (
                <div className="bg-[#ECFDF5] rounded-xl p-4">
                  <p className="text-sm text-[#059669] font-medium">
                    🎉 Great job! Your resume contains all the major sections.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION BREAKDOWN */}

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm mt-6">
          <div className="mb-6">
            <h2 className="font-bold text-[#0F172A]">Resume Breakdown</h2>

            <p className="text-xs text-[#94A3B8] mt-1">
              Overview of your resume sections
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                name: "Contact",
                complete: completedContactFields,
                total: 5,
                icon: "👤",
              },
              {
                name: "Summary",
                complete: resume.summary && resume.summary.length > 50 ? 1 : 0,
                total: 1,
                icon: "📝",
              },
              {
                name: "Experience",
                complete: resume.experience.length,
                total: 2,
                icon: "💼",
              },
              {
                name: "Education",
                complete: resume.education.length,
                total: 1,
                icon: "🎓",
              },
              {
                name: "Skills",
                complete: resume.skills.length,
                total: 5,
                icon: "⚡",
              },
            ].map((item) => {
              const percentage = Math.min(
                (item.complete / item.total) * 100,
                100,
              );

              return (
                <div
                  key={item.name}
                  className="border border-[#E2E8F0] rounded-xl p-4"
                >
                  <div className="text-xl mb-3">{item.icon}</div>

                  <div className="text-xs font-semibold text-[#0F172A]">
                    {item.name}
                  </div>

                  <div className="flex justify-between text-[10px] text-[#94A3B8] mt-2">
                    <span>
                      {item.complete}/{item.total}
                    </span>

                    <span>{Math.round(percentage)}%</span>
                  </div>

                  <div className="h-1.5 bg-[#F1F5F9] rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2563EB]"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumeAnalysis;
