import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../../components/Navbar/Sidebar";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const ImportResume = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  // ========================================
  // EXTRACT TEXT FROM PDF
  // ========================================

  const extractPDFText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    let text = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);

      const content = await page.getTextContent();

      const pageText = content.items.map((item) => item.str).join(" ");

      text += pageText + "\n";
    }

    return text;
  };

  // ========================================
  // EXTRACT TEXT FROM DOCX
  // ========================================

  const extractDOCXText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.extractRawText({
      arrayBuffer,
    });

    return result.value;
  };

  // ========================================
  // EXTRACT TEXT FROM TXT
  // ========================================

  const extractTXTText = async (file) => {
    return await file.text();
  };

  // ========================================
  // PARSE RESUME
  // ========================================

  const parseResume = (text) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    // EMAIL
    const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

    // PHONE
    const phoneMatch = text.match(
      /(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/,
    );

    // LINKEDIN
    const linkedinMatch = text.match(
      /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i,
    );

    // NAME
    const name = lines[0] || "";

    // ========================================
    // FIND SECTION
    // ========================================

    const findSection = (keywords) => {
      const index = lines.findIndex((line) =>
        keywords.some(
          (keyword) =>
            line.toLowerCase() === keyword.toLowerCase() ||
            line.toLowerCase().includes(keyword.toLowerCase()),
        ),
      );

      if (index === -1) return [];

      const sectionLines = [];

      for (let i = index + 1; i < lines.length; i++) {
        const currentLine = lines[i].toLowerCase();

        const isNewSection = [
          "experience",
          "work experience",
          "professional experience",
          "education",
          "skills",
          "technical skills",
          "professional summary",
          "summary",
          "profile",
          "projects",
          "certifications",
          "references",
        ].some((heading) => currentLine === heading);

        if (isNewSection) break;

        sectionLines.push(lines[i]);
      }

      return sectionLines;
    };

    // ========================================
    // SUMMARY
    // ========================================

    const summaryLines = findSection([
      "professional summary",
      "summary",
      "profile",
      "about me",
    ]);

    const summary = summaryLines.slice(0, 5).join(" ");

    // ========================================
    // SKILLS
    // ========================================

    const skillsLines = findSection([
      "skills",
      "technical skills",
      "core competencies",
      "technologies",
    ]);

    const skills = skillsLines
      .join(",")
      .split(/[,|•·]/)
      .map((skill) => skill.trim())
      .filter(
        (skill) =>
          skill.length > 1 &&
          skill.length < 40 &&
          !/^(skills|technical skills)$/i.test(skill),
      )
      .slice(0, 20);

    // ========================================
    // EDUCATION
    // ========================================

    const educationLines = findSection([
      "education",
      "academic background",
      "qualifications",
    ]);

    const education =
      educationLines.length > 0
        ? [
            {
              id: Date.now(),
              degree: educationLines[0] || "",
              school: educationLines[1] || "",
              period: educationLines[2] || "",
            },
          ]
        : [];

    // ========================================
    // EXPERIENCE
    // ========================================

    const experienceLines = findSection([
      "experience",
      "work experience",
      "professional experience",
      "employment history",
    ]);

    const experience =
      experienceLines.length > 0
        ? [
            {
              id: Date.now() + 1,
              role: experienceLines[0] || "",
              company: experienceLines[1] || "",
              period: experienceLines[2] || "",
              bullets: experienceLines
                .slice(3, 8)
                .filter((line) => line.length > 10),
            },
          ]
        : [];

    // ========================================
    // TITLE
    // ========================================

    let title = "";

    if (lines.length > 1) {
      const possibleTitle = lines[1];

      if (!possibleTitle.includes("@") && !possibleTitle.match(/\d{7,}/)) {
        title = possibleTitle;
      }
    }

    // ========================================
    // RETURN STRUCTURED RESUME
    // ========================================

    return {
      contact: {
        name,
        title,
        email: emailMatch ? emailMatch[0] : "",
        phone: phoneMatch ? phoneMatch[0] : "",
        location: "",
        linkedin: linkedinMatch ? linkedinMatch[0] : "",
      },

      summary,

      experience,

      education,

      skills,
    };
  };

  // ========================================
  // HANDLE FILE
  // ========================================

  const handleFile = async (file) => {
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const allowedExtensions = [".pdf", ".docx", ".txt"];

    const extension = "." + file.name.split(".").pop().toLowerCase();

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(extension)
    ) {
      setError("Please upload a PDF, DOCX, or TXT resume.");
      return;
    }

    setFileName(file.name);
    setError("");
    setStatus("extracting");

    try {
      let extractedText = "";

      if (extension === ".pdf") {
        extractedText = await extractPDFText(file);
      } else if (extension === ".docx") {
        extractedText = await extractDOCXText(file);
      } else if (extension === ".txt") {
        extractedText = await extractTXTText(file);
      }

      if (!extractedText.trim()) {
        throw new Error(
          "We couldn't extract text from this resume. Please try another file.",
        );
      }

      setStatus("parsing");

      // Small delay so user sees parsing state
      await new Promise((resolve) => setTimeout(resolve, 700));

      const parsedResume = parseResume(extractedText);

      // Save parsed resume
      localStorage.setItem("resumeData", JSON.stringify(parsedResume));

      setStatus("success");

      // Redirect to editor
      setTimeout(() => {
        navigate("/editor");
      }, 1200);
    } catch (err) {
      console.error(err);

      setStatus("idle");

      setError(
        err.message || "Something went wrong while importing your resume.",
      );
    }
  };

  // ========================================
  // INPUT CHANGE
  // ========================================

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];

    handleFile(file);
  };

  // ========================================
  // DRAG EVENTS
  // ========================================

  const handleDragOver = (event) => {
    event.preventDefault();

    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();

    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    handleFile(file);
  };

  return (
    <div
      className="flex min-h-screen bg-[#F8FAFC]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <Sidebar />

      <main className="flex-1 md:ml-60 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* BACK */}

          <Link
            to="/dashboard"
            className="text-sm text-[#94A3B8] hover:text-[#2563EB] transition"
          >
            ← Back to Dashboard
          </Link>

          {/* HEADER */}

          <div className="text-center mt-8 mb-8">
            <div className="text-5xl mb-4">📄</div>

            <h1 className="text-3xl font-extrabold text-[#0F172A]">
              Import Your Resume
            </h1>

            <p className="text-sm text-[#64748B] mt-3 max-w-md mx-auto">
              Upload your existing resume and we'll automatically extract your
              information so you can edit, analyze, and improve it.
            </p>
          </div>

          {/* UPLOAD CARD */}

          <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-sm p-6 md:p-10">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => status === "idle" && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-[#2563EB] bg-[#EFF6FF]"
                  : "border-[#CBD5E1] hover:border-[#2563EB] hover:bg-[#F8FAFC]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleInputChange}
                className="hidden"
              />

              {/* IDLE */}

              {status === "idle" && (
                <>
                  <div className="text-5xl mb-4">☁️</div>

                  <h3 className="font-bold text-[#0F172A]">
                    Drag & drop your resume here
                  </h3>

                  <p className="text-xs text-[#94A3B8] mt-2">
                    or click to browse files from your computer
                  </p>

                  <div className="mt-5 inline-flex gap-2">
                    {["PDF", "DOCX", "TXT"].map((type) => (
                      <span
                        key={type}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-[#F1F5F9] text-[#64748B]"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* EXTRACTING */}

              {status === "extracting" && (
                <>
                  <div className="text-5xl mb-4 animate-bounce">📄</div>

                  <h3 className="font-bold text-[#0F172A]">
                    Reading your resume...
                  </h3>

                  <p className="text-xs text-[#94A3B8] mt-2">
                    Extracting information from {fileName}
                  </p>
                </>
              )}

              {/* PARSING */}

              {status === "parsing" && (
                <>
                  <div className="text-5xl mb-4 animate-pulse">🤖</div>

                  <h3 className="font-bold text-[#0F172A]">
                    Organizing your information...
                  </h3>

                  <p className="text-xs text-[#94A3B8] mt-2">
                    Identifying your skills, experience and education
                  </p>
                </>
              )}

              {/* SUCCESS */}

              {status === "success" && (
                <>
                  <div className="text-5xl mb-4">✅</div>

                  <h3 className="font-bold text-[#22C55E]">
                    Resume imported successfully!
                  </h3>

                  <p className="text-xs text-[#94A3B8] mt-2">
                    Opening the editor...
                  </p>
                </>
              )}
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                <p className="text-xs text-[#DC2626]">{error}</p>
              </div>
            )}

            {/* INFO */}

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              {[
                {
                  icon: "🔒",
                  title: "Private",
                  desc: "Your file is processed locally.",
                },
                {
                  icon: "⚡",
                  title: "Fast",
                  desc: "Import your resume in seconds.",
                },
                {
                  icon: "✏️",
                  title: "Editable",
                  desc: "Review and edit everything.",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-[#F8FAFC] rounded-xl p-4 text-center"
                >
                  <div className="text-xl mb-2">{icon}</div>

                  <div className="text-xs font-bold text-[#0F172A]">
                    {title}
                  </div>

                  <div className="text-[10px] text-[#94A3B8] mt-1">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[10px] text-[#94A3B8] mt-5">
            Supported formats: PDF, DOCX and TXT
          </p>
        </div>
      </main>
    </div>
  );
};

export default ImportResume;
