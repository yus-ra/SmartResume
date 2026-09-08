import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Navbar/Sidebar";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ========================================
// TEMPLATES
// ========================================

const templates = [
  {
    id: 1,
    name: "Modern",
    color: "#2563EB",
  },
  {
    id: 2,
    name: "Classic",
    color: "#0F172A",
  },
  {
    id: 3,
    name: "Creative",
    color: "#14B8A6",
  },
];

const sections = ["Contact", "Summary", "Experience", "Education", "Skills"];

// ========================================
// DEFAULT RESUME
// ========================================

const defaultResume = {
  contact: {
    name: "Jordan Davis",
    title: "Senior Software Engineer",
    email: "jordan@email.com",
    phone: "+1 (415) 555-0182",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/jordandavis",
  },

  summary:
    "Senior Software Engineer with 6+ years of experience building scalable web applications. Specialized in React, TypeScript, and distributed systems. Proven track record of delivering high-impact features.",

  experience: [
    {
      id: 1,
      role: "Senior Software Engineer",
      company: "Stripe",
      period: "2022 – Present",
      bullets: [
        "Led migration of payment infrastructure serving 2M+ daily transactions",
        "Reduced API latency by 43% through caching and query optimization",
        "Authored 3 internal RFCs adopted across 6 engineering teams",
      ],
    },
    {
      id: 2,
      role: "Software Engineer",
      company: "Airbnb",
      period: "2019 – 2022",
      bullets: [
        "Built search ranking algorithm improving booking conversion by 18%",
        "Mentored 4 junior engineers in React and TypeScript best practices",
      ],
    },
  ],

  education: [
    {
      id: 1,
      degree: "B.S. Computer Science",
      school: "UC Berkeley",
      period: "2015 – 2019",
    },
  ],

  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "PostgreSQL",
    "AWS",
    "Docker",
    "GraphQL",
    "Python",
  ],
};

// ========================================
// COMPONENT
// ========================================

const ResumeEditor = () => {
  const resumeRef = useRef(null);
  const navigate = useNavigate();

  // TEMPLATE

  const [activeTemplate, setActiveTemplate] = useState(() => {
    const savedTemplate = localStorage.getItem("activeTemplate");

    return savedTemplate ? Number(savedTemplate) : 1;
  });

  // ACTIVE SECTION

  const [activeSection, setActiveSection] = useState(() => {
    const sectionToOpen = localStorage.getItem("activeResumeSection");

    return sectionToOpen || "Contact";
  });

  useEffect(() => {
    localStorage.removeItem("activeResumeSection");
  }, []);

  // UI STATES

  const [saved, setSaved] = useState(false);
  const [zoom, setZoom] = useState(90);

  // RESUME STATE

  const [resume, setResume] = useState(() => {
    try {
      const savedResume = localStorage.getItem("resumeData");

      return savedResume ? JSON.parse(savedResume) : defaultResume;
    } catch (error) {
      console.error("Failed to load resume:", error);

      return defaultResume;
    }
  });

  // ACCENT COLOR

  const accent =
    templates.find((template) => template.id === activeTemplate)?.color ||
    "#2563EB";

  // ========================================
  // SAVE
  // ========================================

  const handleSave = () => {
    localStorage.setItem("resumeData", JSON.stringify(resume));

    localStorage.setItem("activeTemplate", activeTemplate.toString());

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  // ========================================
  // CONTACT
  // ========================================

  const updateContact = (field, value) => {
    setResume((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value,
      },
    }));
  };

  // ========================================
  // SUMMARY
  // ========================================

  const updateSummary = (value) => {
    setResume((prev) => ({
      ...prev,
      summary: value,
    }));
  };

  // ========================================
  // EXPERIENCE
  // ========================================

  const updateExperience = (index, field, value) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  };

  const updateBullet = (experienceIndex, bulletIndex, value) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((item, i) =>
        i === experienceIndex
          ? {
              ...item,
              bullets: item.bullets.map((bullet, j) =>
                j === bulletIndex ? value : bullet,
              ),
            }
          : item,
      ),
    }));
  };

  const addExperience = () => {
    setResume((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: Date.now(),
          role: "New Job Title",
          company: "Company Name",
          period: "Year – Present",
          bullets: ["Describe your achievement here"],
        },
      ],
    }));
  };

  const removeExperience = (index) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const addBullet = (experienceIndex) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((item, i) =>
        i === experienceIndex
          ? {
              ...item,
              bullets: [...item.bullets, "New achievement"],
            }
          : item,
      ),
    }));
  };

  const removeBullet = (experienceIndex, bulletIndex) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((item, i) =>
        i === experienceIndex
          ? {
              ...item,
              bullets: item.bullets.filter((_, j) => j !== bulletIndex),
            }
          : item,
      ),
    }));
  };

  // ========================================
  // EDUCATION
  // ========================================

  const updateEducation = (index, field, value) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  };

  const addEducation = () => {
    setResume((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: Date.now(),
          degree: "New Degree",
          school: "University Name",
          period: "Year – Year",
        },
      ],
    }));
  };

  const removeEducation = (index) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  // ========================================
  // SKILLS
  // ========================================

  const addSkill = (skill) => {
    const trimmedSkill = skill.trim();

    if (!trimmedSkill) return;

    if (resume.skills.includes(trimmedSkill)) return;

    setResume((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmedSkill],
    }));
  };

  const removeSkill = (skill) => {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }));
  };

  // ========================================
  // ANALYZE
  // ========================================

  const handleAnalyze = () => {
    localStorage.setItem("resumeData", JSON.stringify(resume));

    localStorage.setItem("activeTemplate", activeTemplate.toString());

    navigate("/analysis");
  };

  // ========================================
  // EXPORT PDF
  // ========================================

  const exportPDF = async () => {
    const resumeElement = resumeRef.current;

    if (!resumeElement) return;

    try {
      const canvas = await html2canvas(resumeElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();

      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);

      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;

        pdf.addPage();

        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);

        heightLeft -= pdfHeight;
      }

      const fileName =
        resume.contact.name?.trim().replace(/\s+/g, "_") || "Resume";

      pdf.save(`${fileName}_Resume.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div
      className="flex min-h-screen bg-[#F8FAFC]"
      style={{
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <Sidebar />

      <main className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* TOP BAR */}

        <div className="border-b border-[#E2E8F0] bg-white px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-[#94A3B8] hover:text-[#2563EB] text-sm"
            >
              ← Back
            </Link>

            <div className="h-5 w-px bg-[#E2E8F0]" />

            <div>
              <div className="font-semibold text-[#0F172A] text-sm">
                {resume.contact.name}'s Resume
              </div>

              <div className="text-[10px] text-[#94A3B8]">
                Last edited just now
              </div>
            </div>

            <span className="text-[10px] text-[#F59E0B] bg-[#FFFBEB] border border-[#FDE68A] px-2 py-1 rounded-full">
              Draft
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#475569]"
            >
              {saved ? "✓ Saved" : "Save Changes"}
            </button>

            <button
              onClick={handleAnalyze}
              className="hidden md:block text-xs font-semibold text-white px-4 py-2 rounded-lg shadow-sm"
              style={{
                background: "linear-gradient(135deg,#14B8A6,#0F766E)",
              }}
            >
              🤖 Analyze
            </button>

            <button
              onClick={exportPDF}
              className="text-xs font-semibold text-white px-4 py-2 rounded-lg shadow-sm"
              style={{
                background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
              }}
            >
              📥 Export PDF
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT EDITOR */}

          <div className="w-80 flex-shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col">
            {/* TEMPLATE */}

            <div className="p-4 border-b border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  Resume Template
                </div>

                <span className="text-[10px] text-[#2563EB] font-medium">
                  Customize
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setActiveTemplate(template.id)}
                    className="py-2 rounded-lg text-[10px] font-semibold border"
                    style={{
                      borderColor:
                        activeTemplate === template.id
                          ? template.color
                          : "#E2E8F0",

                      backgroundColor:
                        activeTemplate === template.id
                          ? `${template.color}15`
                          : "white",

                      color:
                        activeTemplate === template.id
                          ? template.color
                          : "#64748B",
                    }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTIONS */}

            <div className="p-4 border-b border-[#E2E8F0]">
              <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3">
                Resume Sections
              </div>

              <div className="flex flex-col gap-1">
                {sections.map((section, index) => {
                  const active = activeSection === section;

                  return (
                    <button
                      key={section}
                      onClick={() => setActiveSection(section)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left"
                      style={{
                        backgroundColor: active ? `${accent}15` : "transparent",

                        color: active ? accent : "#475569",
                      }}
                    >
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[9px]"
                        style={{
                          backgroundColor: active ? accent : "#F1F5F9",

                          color: active ? "white" : "#94A3B8",
                        }}
                      >
                        {index + 1}
                      </span>

                      {section}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FORM */}

            <div className="flex-1 p-4 overflow-y-auto">
              {/* CONTACT */}

              {activeSection === "Contact" && (
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-4">
                    Personal Information
                  </h3>

                  <div className="flex flex-col gap-3">
                    {[
                      ["name", "Full Name"],
                      ["title", "Professional Title"],
                      ["email", "Email Address"],
                      ["phone", "Phone Number"],
                      ["location", "Location"],
                      ["linkedin", "LinkedIn"],
                    ].map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1">
                          {label}
                        </label>

                        <input
                          value={resume.contact[field] || ""}
                          onChange={(e) => updateContact(field, e.target.value)}
                          className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUMMARY */}

              {activeSection === "Summary" && (
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-2">
                    Professional Summary
                  </h3>

                  <p className="text-[11px] text-[#94A3B8] mb-4">
                    Write a short introduction highlighting your experience.
                  </p>

                  <textarea
                    value={resume.summary || ""}
                    onChange={(e) => updateSummary(e.target.value)}
                    rows={10}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-3 text-xs text-[#475569] outline-none resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* EXPERIENCE */}

              {activeSection === "Experience" && (
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-4">
                    Work Experience
                  </h3>

                  <div className="flex flex-col gap-4">
                    {resume.experience.map((experience, index) => (
                      <div
                        key={experience.id}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-semibold text-[#94A3B8]">
                            Experience {index + 1}
                          </span>

                          <button
                            onClick={() => removeExperience(index)}
                            className="text-[10px] text-red-500"
                          >
                            Remove
                          </button>
                        </div>

                        <input
                          value={experience.role}
                          onChange={(e) =>
                            updateExperience(index, "role", e.target.value)
                          }
                          className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2 py-2 text-xs mb-2"
                        />

                        <input
                          value={experience.company}
                          onChange={(e) =>
                            updateExperience(index, "company", e.target.value)
                          }
                          className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2 py-2 text-xs mb-2"
                        />

                        <input
                          value={experience.period}
                          onChange={(e) =>
                            updateExperience(index, "period", e.target.value)
                          }
                          className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2 py-2 text-xs mb-3"
                        />

                        <div className="flex flex-col gap-2">
                          {experience.bullets.map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex gap-2">
                              <textarea
                                value={bullet}
                                onChange={(e) =>
                                  updateBullet(
                                    index,
                                    bulletIndex,
                                    e.target.value,
                                  )
                                }
                                rows={2}
                                className="flex-1 text-[10px] border border-[#E2E8F0] rounded-lg p-2 outline-none resize-none"
                              />

                              <button
                                onClick={() => removeBullet(index, bulletIndex)}
                                className="text-red-500 text-xs px-2"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => addBullet(index)}
                          className="text-[10px] text-[#2563EB] font-semibold mt-3"
                        >
                          + Add achievement
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={addExperience}
                      className="w-full border-2 border-dashed border-[#CBD5E1] rounded-xl py-3 text-xs font-medium text-[#64748B]"
                    >
                      + Add Experience
                    </button>
                  </div>
                </div>
              )}

              {/* EDUCATION */}

              {activeSection === "Education" && (
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-4">
                    Education
                  </h3>

                  <div className="flex flex-col gap-4">
                    {resume.education.map((education, index) => (
                      <div
                        key={education.id}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-semibold text-[#94A3B8]">
                            Education {index + 1}
                          </span>

                          <button
                            onClick={() => removeEducation(index)}
                            className="text-[10px] text-red-500"
                          >
                            Remove
                          </button>
                        </div>

                        {[
                          ["degree", "Degree"],
                          ["school", "School"],
                          ["period", "Period"],
                        ].map(([field, label]) => (
                          <div key={field} className="mb-3">
                            <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase mb-1">
                              {label}
                            </label>

                            <input
                              value={education[field] || ""}
                              onChange={(e) =>
                                updateEducation(index, field, e.target.value)
                              }
                              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    ))}

                    <button
                      onClick={addEducation}
                      className="w-full border-2 border-dashed border-[#CBD5E1] rounded-xl py-3 text-xs font-medium text-[#64748B]"
                    >
                      + Add Education
                    </button>
                  </div>
                </div>
              )}

              {/* SKILLS */}

              {activeSection === "Skills" && (
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-2">
                    Skills
                  </h3>

                  <p className="text-[11px] text-[#94A3B8] mb-4">
                    Add skills relevant to your target job.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {resume.skills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${accent}15`,
                          color: accent,
                        }}
                      >
                        {skill}

                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 text-[#94A3B8] hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <input
                    placeholder="Type a skill and press Enter"
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();

                        addSkill(e.target.value);

                        e.target.value = "";
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* RESUME PREVIEW */}

          <div className="flex-1 bg-[#F1F5F9] overflow-auto p-8 flex justify-center">
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                transition: "0.2s",
              }}
            >
              <div
                ref={resumeRef}
                className="bg-white shadow-xl"
                style={{
                  width: "620px",
                  minHeight: "850px",
                  padding: "48px",
                }}
              >
                {/* ACCENT LINE */}

                <div
                  className="h-2 mb-7 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${accent}, #14B8A6)`,
                  }}
                />

                {/* HEADER */}

                <div className="mb-6">
                  <h1 className="font-extrabold text-[#0F172A] text-3xl">
                    {resume.contact.name}
                  </h1>

                  <div
                    className="font-semibold text-sm mt-1"
                    style={{ color: accent }}
                  >
                    {resume.contact.title}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-[#64748B]">
                    <span>{resume.contact.email}</span>
                    <span>{resume.contact.phone}</span>
                    <span>{resume.contact.location}</span>
                    <span>{resume.contact.linkedin}</span>
                  </div>
                </div>

                <div className="h-px bg-[#E2E8F0] mb-6" />

                {/* SUMMARY */}

                <div className="mb-6">
                  <h2
                    className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3"
                    style={{ color: accent }}
                  >
                    Professional Summary
                  </h2>

                  <p className="text-[12px] leading-relaxed text-[#475569]">
                    {resume.summary}
                  </p>
                </div>

                {/* EXPERIENCE */}

                <div className="mb-6">
                  <h2
                    className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
                    style={{ color: accent }}
                  >
                    Experience
                  </h2>

                  {resume.experience.map((experience) => (
                    <div key={experience.id} className="mb-5">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="font-bold text-[13px] text-[#0F172A]">
                            {experience.role}
                          </div>

                          <div className="text-[11px] text-[#64748B] mt-1">
                            {experience.company}
                          </div>
                        </div>

                        <div className="text-[10px] text-[#94A3B8] whitespace-nowrap">
                          {experience.period}
                        </div>
                      </div>

                      <ul className="mt-2 space-y-1">
                        {experience.bullets.map((bullet, bulletIndex) => (
                          <li
                            key={bulletIndex}
                            className="flex gap-2 text-[11px] leading-relaxed text-[#475569]"
                          >
                            <span
                              style={{
                                color: accent,
                              }}
                            >
                              •
                            </span>

                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* SKILLS */}

                <div className="mb-6">
                  <h2
                    className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3"
                    style={{ color: accent }}
                  >
                    Skills
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-semibold px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: `${accent}15`,
                          color: accent,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* EDUCATION */}

                <div>
                  <h2
                    className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3"
                    style={{ color: accent }}
                  >
                    Education
                  </h2>

                  <div className="flex flex-col gap-4">
                    {resume.education.map((education) => (
                      <div
                        key={education.id}
                        className="flex justify-between items-start"
                      >
                        <div>
                          <div className="font-bold text-[13px] text-[#0F172A]">
                            {education.degree}
                          </div>

                          <div className="text-[11px] text-[#64748B]">
                            {education.school}
                          </div>
                        </div>

                        <div className="text-[10px] text-[#94A3B8] whitespace-nowrap">
                          {education.period}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ZOOM CONTROLS */}

              <div className="flex justify-center gap-2 mt-5">
                <button
                  onClick={() => setZoom((prev) => Math.max(60, prev - 10))}
                  className="bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg text-xs"
                >
                  −
                </button>

                <div className="bg-white border border-[#E2E8F0] px-4 py-1.5 rounded-lg text-xs font-semibold text-[#475569]">
                  {zoom}%
                </div>

                <button
                  onClick={() => setZoom((prev) => Math.min(120, prev + 10))}
                  className="bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg text-xs"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumeEditor;
