import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../../components/Navbar/Sidebar";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// ========================================
// CONFIGURE PDF.JS WORKER
// ========================================

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// ========================================
// SECTION HEADINGS
// ========================================

const sectionHeadings = [
  "experience",
  "work experience",
  "professional experience",
  "employment history",
  "work history",

  "education",
  "academic background",
  "academic qualifications",
  "qualifications",

  "skills",
  "technical skills",
  "core skills",
  "core competencies",
  "technologies",

  "professional summary",
  "summary",
  "profile",
  "about me",
  "career objective",
  "objective",

  "projects",
  "personal projects",
  "project experience",

  "certifications",
  "certificates",

  "references",
  "languages",
  "interests",
  "awards",
  "achievements",
];

// ========================================
// NORMALIZE HEADING
// ========================================

const normalizeHeading = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[:\-–—]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ========================================
// CHECK SECTION HEADING
// ========================================

const isSectionHeading = (text = "") => {
  const normalized = normalizeHeading(text);

  return sectionHeadings.some((heading) => {
    return normalized === heading;
  });
};

// ========================================
// NORMALIZE EXTRACTED TEXT
// IMPORTANT:
// Preserve line breaks.
// ========================================

const normalizeExtractedText = (text = "") => {
  return text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[•●▪◦]/g, "•")
    .split("\n")
    .map((line) => line.replace(/[ ]{2,}/g, " ").trim())
    .filter(Boolean)
    .join("\n");
};

// ========================================
// GET CLEAN LINES
// ========================================

const getLines = (text = "") => {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/\s+/g, " "));
};

// ========================================
// FIND SECTION
// ========================================

const findSection = (lines, keywords) => {
  const normalizedKeywords = keywords.map((keyword) =>
    normalizeHeading(keyword),
  );

  const index = lines.findIndex((line) => {
    const normalized = normalizeHeading(line);

    return normalizedKeywords.some((keyword) => {
      return normalized === keyword || normalized.startsWith(`${keyword} `);
    });
  });

  if (index === -1) {
    return [];
  }

  const sectionLines = [];

  for (let i = index + 1; i < lines.length; i++) {
    const currentLine = lines[i];

    if (isSectionHeading(currentLine)) {
      break;
    }

    sectionLines.push(currentLine);
  }

  return sectionLines;
};

// ========================================
// EMAIL
// ========================================

const findEmail = (text) => {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

  const match = text.match(emailRegex);

  return match ? match[0] : "";
};

// ========================================
// PHONE
// ========================================

const findPhone = (text) => {
  const phoneRegex =
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{2,4})?/;

  const matches = text.match(new RegExp(phoneRegex, "g")) || [];

  for (const match of matches) {
    const digits = match.replace(/\D/g, "");

    if (digits.length >= 10 && digits.length <= 15) {
      return match.trim();
    }
  }

  return "";
};

// ========================================
// LINKEDIN
// ========================================

const findLinkedIn = (text) => {
  const linkedinRegex =
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i;

  const match = text.match(linkedinRegex);

  return match ? match[0] : "";
};

// ========================================
// GITHUB
// ========================================

const findGithub = (text) => {
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+/i;

  const match = text.match(githubRegex);

  return match ? match[0] : "";
};

// ========================================
// FIND NAME
// ========================================

const findName = (lines) => {
  const excludedWords = [
    "resume",
    "curriculum vitae",
    "cv",
    "professional resume",
    "profile",
  ];

  const candidates = lines.slice(0, 10);

  for (const line of candidates) {
    const cleanLine = line.trim();
    const lower = cleanLine.toLowerCase();

    // Skip empty lines
    if (!cleanLine) {
      continue;
    }

    // Skip obvious headings
    if (isSectionHeading(cleanLine)) {
      continue;
    }

    // Skip excluded words
    if (excludedWords.includes(lower)) {
      continue;
    }

    // Skip email
    if (cleanLine.includes("@")) {
      continue;
    }

    // Skip URLs
    if (
      lower.includes("linkedin.com") ||
      lower.includes("github.com") ||
      lower.includes("http://") ||
      lower.includes("https://")
    ) {
      continue;
    }

    // Skip lines containing long numbers
    if (/\d{6,}/.test(cleanLine)) {
      continue;
    }

    const words = cleanLine.split(/\s+/);

    // A name usually has 2–5 words
    if (words.length < 2 || words.length > 5) {
      continue;
    }

    // Name should mostly contain letters
    if (!/^[A-Za-zÀ-ÿ' -]+$/.test(cleanLine)) {
      continue;
    }

    // Avoid sentences
    if (cleanLine.length > 45) {
      continue;
    }

    return cleanLine
      .split(/\s+/)
      .map((word) => {
        if (!word) return "";

        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  }

  return "";
};

// ========================================
// FIND TITLE
// ========================================

const findTitle = (lines, name) => {
  if (!name) {
    return "";
  }

  const nameIndex = lines.findIndex(
    (line) => line.toLowerCase() === name.toLowerCase(),
  );

  if (nameIndex === -1) {
    return "";
  }

  for (let i = nameIndex + 1; i < Math.min(lines.length, nameIndex + 6); i++) {
    const line = lines[i];

    if (!line) {
      continue;
    }

    const lower = line.toLowerCase();

    // Skip contact information
    if (line.includes("@")) {
      continue;
    }

    if (lower.includes("linkedin.com") || lower.includes("github.com")) {
      continue;
    }

    if (/\d{7,}/.test(line)) {
      continue;
    }

    if (isSectionHeading(line)) {
      continue;
    }

    // Don't treat a long sentence as a title
    if (line.length > 80) {
      continue;
    }

    if (line.split(/\s+/).length <= 10) {
      return line;
    }
  }

  return "";
};

// ========================================
// FIND LOCATION
// ========================================

const findLocation = (lines) => {
  const locationPatterns = [
    /\babuja\b/i,
    /\blagos\b/i,
    /\bnigeria\b/i,
    /\bkano\b/i,
    /\bkaduna\b/i,
    /\bkeffi\b/i,
    /\bport harcourt\b/i,
    /\bibadan\b/i,
    /\bbenin city\b/i,
    /\blondon\b/i,
    /\bnew york\b/i,
    /\bsan francisco\b/i,
    /\bcanada\b/i,
    /\bunited states\b/i,
    /\bunited kingdom\b/i,
  ];

  for (const line of lines.slice(0, 15)) {
    if (!line) continue;

    if (line.includes("@")) {
      continue;
    }

    if (
      line.toLowerCase().includes("linkedin") ||
      line.toLowerCase().includes("github")
    ) {
      continue;
    }

    if (locationPatterns.some((pattern) => pattern.test(line))) {
      if (line.length <= 80) {
        return line;
      }
    }
  }

  return "";
};

// ========================================
// FIND SUMMARY
// ========================================

const parseSummary = (lines, name) => {
  const summaryLines = findSection(lines, [
    "professional summary",
    "summary",
    "profile",
    "about me",
    "career objective",
    "objective",
  ]);

  if (summaryLines.length > 0) {
    return summaryLines.slice(0, 6).join(" ").trim();
  }

  // ========================================
  // FALLBACK SUMMARY
  // ========================================

  if (name) {
    const nameIndex = lines.findIndex(
      (line) => line.toLowerCase() === name.toLowerCase(),
    );

    if (nameIndex !== -1) {
      const possibleSummary = [];

      for (
        let i = nameIndex + 1;
        i < Math.min(lines.length, nameIndex + 10);
        i++
      ) {
        const line = lines[i];

        if (!line) continue;

        if (isSectionHeading(line)) {
          break;
        }

        if (line.includes("@")) {
          continue;
        }

        if (
          line.toLowerCase().includes("linkedin") ||
          line.toLowerCase().includes("github")
        ) {
          continue;
        }

        if (/\d{7,}/.test(line)) {
          continue;
        }

        // Summary sentences are normally longer
        if (line.length >= 50) {
          possibleSummary.push(line);
        }
      }

      return possibleSummary.slice(0, 3).join(" ").trim();
    }
  }

  return "";
};

// ========================================
// DATE / PERIOD DETECTION
// ========================================

const periodRegex =
  /\b(?:(?:19|20)\d{2})\s*(?:[-–—]|to)\s*(?:(?:19|20)\d{2}|present|current)\b/i;

const monthYearPeriodRegex =
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(?:19|20)\d{2}\s*(?:[-–—]|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(?:19|20)\d{2}|present|current)\b/i;

const containsPeriod = (line) => {
  return periodRegex.test(line) || monthYearPeriodRegex.test(line);
};

// ========================================
// CLEAN BULLET
// ========================================

const cleanBullet = (line) => {
  return line.replace(/^[•●▪◦\-–—]\s*/, "").trim();
};

// ========================================
// PARSE EXPERIENCE
// ========================================

const parseExperience = (lines) => {
  if (!lines.length) {
    return [];
  }

  const experiences = [];

  let currentExperience = null;

  const createExperience = () => ({
    id: Date.now() + Math.floor(Math.random() * 100000),
    role: "",
    company: "",
    period: "",
    bullets: [],
  });

  for (const line of lines) {
    if (!line) {
      continue;
    }

    // ========================================
    // DATE FOUND
    // ========================================

    if (containsPeriod(line)) {
      // If this line contains both a date and useful text,
      // keep the text as part of the experience.
      const newExperience = createExperience();

      newExperience.period = line;

      if (currentExperience) {
        experiences.push(currentExperience);
      }

      currentExperience = newExperience;

      continue;
    }

    // ========================================
    // CREATE FIRST EXPERIENCE
    // ========================================

    if (!currentExperience) {
      currentExperience = createExperience();
    }

    // ========================================
    // BULLET
    // ========================================

    if (/^[•●▪◦\-–—]/.test(line)) {
      currentExperience.bullets.push(cleanBullet(line));

      continue;
    }

    // ========================================
    // ROLE
    // ========================================

    if (!currentExperience.role && line.length <= 100) {
      currentExperience.role = line;

      continue;
    }

    // ========================================
    // COMPANY
    // ========================================

    if (!currentExperience.company && line.length <= 100) {
      currentExperience.company = line;

      continue;
    }

    // ========================================
    // ACHIEVEMENT / RESPONSIBILITY
    // ========================================

    if (line.length > 10) {
      currentExperience.bullets.push(cleanBullet(line));
    }
  }

  // Add last experience
  if (currentExperience) {
    experiences.push(currentExperience);
  }

  // ========================================
  // CLEAN EXPERIENCES
  // ========================================

  return experiences
    .map((experience) => ({
      ...experience,
      bullets: experience.bullets.filter(Boolean).slice(0, 8),
    }))
    .filter(
      (experience) =>
        experience.role ||
        experience.company ||
        experience.period ||
        experience.bullets.length > 0,
    )
    .slice(0, 5);
};

// ========================================
// PARSE EDUCATION
// ========================================

const parseEducation = (lines) => {
  if (!lines.length) {
    return [];
  }

  const education = [];

  let currentEducation = null;

  const createEducation = () => ({
    id: Date.now() + Math.floor(Math.random() * 100000),
    degree: "",
    school: "",
    period: "",
  });

  for (const line of lines) {
    if (!line) {
      continue;
    }

    // ========================================
    // PERIOD
    // ========================================

    if (containsPeriod(line)) {
      if (!currentEducation) {
        currentEducation = createEducation();
      }

      currentEducation.period = line;

      education.push(currentEducation);

      currentEducation = null;

      continue;
    }

    // ========================================
    // CREATE ENTRY
    // ========================================

    if (!currentEducation) {
      currentEducation = createEducation();
    }

    // ========================================
    // DEGREE
    // ========================================

    if (!currentEducation.degree) {
      currentEducation.degree = line;

      continue;
    }

    // ========================================
    // SCHOOL
    // ========================================

    if (!currentEducation.school) {
      currentEducation.school = line;

      continue;
    }

    // ========================================
    // IF CURRENT ENTRY IS COMPLETE
    // ========================================

    education.push(currentEducation);

    currentEducation = createEducation();

    currentEducation.degree = line;
  }

  if (currentEducation) {
    education.push(currentEducation);
  }

  return education
    .filter((item) => item.degree || item.school || item.period)
    .slice(0, 4);
};

// ========================================
// PARSE SKILLS
// ========================================

const parseSkills = (lines) => {
  if (!lines.length) {
    return [];
  }

  const skills = [];

  for (const line of lines) {
    if (!line) continue;

    const pieces = line
      .split(/[,|•·;]/)
      .map((skill) => skill.replace(/^[\-–—]\s*/, "").trim())
      .filter(Boolean);

    for (const skill of pieces) {
      if (skill.length >= 2 && skill.length <= 50 && !isSectionHeading(skill)) {
        skills.push(skill);
      }
    }
  }

  // Remove duplicates
  return [...new Set(skills)].slice(0, 30);
};

// ========================================
// PARSE RESUME
// ========================================

const parseResume = (text) => {
  const lines = getLines(text);

  console.log("==============================");
  console.log("EXTRACTED RESUME LINES");
  console.log("==============================");
  console.log(lines);

  // ========================================
  // CONTACT
  // ========================================

  const email = findEmail(text);
  const phone = findPhone(text);
  const linkedin = findLinkedIn(text);
  const github = findGithub(text);

  // ========================================
  // NAME
  // ========================================

  const name = findName(lines);

  // ========================================
  // TITLE
  // ========================================

  const title = findTitle(lines, name);

  // ========================================
  // LOCATION
  // ========================================

  const location = findLocation(lines);

  // ========================================
  // SUMMARY
  // ========================================

  const summary = parseSummary(lines, name);

  // ========================================
  // EXPERIENCE
  // ========================================

  const experienceLines = findSection(lines, [
    "experience",
    "work experience",
    "professional experience",
    "employment history",
    "work history",
  ]);

  const experience = parseExperience(experienceLines);

  // ========================================
  // EDUCATION
  // ========================================

  const educationLines = findSection(lines, [
    "education",
    "academic background",
    "academic qualifications",
    "qualifications",
  ]);

  const education = parseEducation(educationLines);

  // ========================================
  // SKILLS
  // ========================================

  const skillsLines = findSection(lines, [
    "skills",
    "technical skills",
    "core skills",
    "core competencies",
    "technologies",
  ]);

  const skills = parseSkills(skillsLines);

  // ========================================
  // FINAL STRUCTURE
  // ========================================

  const parsedResume = {
    contact: {
      name,
      title,
      email,
      phone,
      location,
      linkedin,
      github,
    },

    summary,

    experience,

    education,

    skills,
  };

  console.log("==============================");
  console.log("PARSED RESUME");
  console.log("==============================");
  console.log(parsedResume);

  return parsedResume;
};

// ========================================
// EXTRACT PDF TEXT
// ========================================

const extractPDFText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise;

  let fullText = "";

  // ========================================
  // LOOP THROUGH PAGES
  // ========================================

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);

    const content = await page.getTextContent();

    const items = content.items
      .filter((item) => typeof item.str === "string" && item.str.trim())
      .map((item) => ({
        text: item.str.trim(),
        x: item.transform?.[4] || 0,
        y: item.transform?.[5] || 0,
      }));

    // ========================================
    // SORT PDF TEXT
    // Top to bottom, left to right
    // ========================================

    items.sort((a, b) => {
      const yDifference = Math.abs(b.y - a.y);

      if (yDifference > 4) {
        return b.y - a.y;
      }

      return a.x - b.x;
    });

    // ========================================
    // GROUP ITEMS INTO LINES
    // ========================================

    const lines = [];

    let currentLine = [];
    let currentY = null;

    for (const item of items) {
      if (currentY === null) {
        currentY = item.y;
        currentLine.push(item.text);
        continue;
      }

      if (Math.abs(item.y - currentY) <= 4) {
        currentLine.push(item.text);
      } else {
        if (currentLine.length) {
          lines.push(currentLine.join(" "));
        }

        currentLine = [item.text];
        currentY = item.y;
      }
    }

    if (currentLine.length) {
      lines.push(currentLine.join(" "));
    }

    fullText += lines.join("\n") + "\n";
  }

  return normalizeExtractedText(fullText);
};

// ========================================
// EXTRACT DOCX TEXT
// ========================================

const extractDOCXText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.extractRawText({
    arrayBuffer,
  });

  return normalizeExtractedText(result.value);
};

// ========================================
// EXTRACT TXT TEXT
// ========================================

const extractTXTText = async (file) => {
  const text = await file.text();

  return normalizeExtractedText(text);
};

// ========================================
// MAIN COMPONENT
// ========================================

const ImportResume = () => {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);

  const [fileName, setFileName] = useState("");

  const [status, setStatus] = useState("idle");

  const [error, setError] = useState("");

  // ========================================
  // HANDLE FILE
  // ========================================

  const handleFile = async (file) => {
    if (!file) {
      return;
    }

    // ========================================
    // ALLOWED FILE TYPES
    // ========================================

    const allowedExtensions = [".pdf", ".docx", ".txt"];

    const extension = "." + file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError("Please upload a PDF, DOCX, or TXT resume.");

      return;
    }

    // ========================================
    // FILE SIZE
    // ========================================

    const maxFileSize = 10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setError(
        "Your resume is too large. Please upload a file smaller than 10MB.",
      );

      return;
    }

    setFileName(file.name);
    setError("");
    setStatus("extracting");

    try {
      let extractedText = "";

      // ========================================
      // PDF
      // ========================================

      if (extension === ".pdf") {
        extractedText = await extractPDFText(file);
      }

      // ========================================
      // DOCX
      // ========================================

      if (extension === ".docx") {
        extractedText = await extractDOCXText(file);
      }

      // ========================================
      // TXT
      // ========================================

      if (extension === ".txt") {
        extractedText = await extractTXTText(file);
      }

      // ========================================
      // CHECK EXTRACTION
      // ========================================

      if (!extractedText.trim()) {
        throw new Error(
          "We couldn't extract text from this resume. Please try another file.",
        );
      }

      console.log("==============================");

      console.log("RAW EXTRACTED TEXT:");

      console.log(extractedText);

      console.log("==============================");

      // ========================================
      // PARSING
      // ========================================

      setStatus("parsing");

      await new Promise((resolve) => setTimeout(resolve, 700));

      const parsedResume = parseResume(extractedText);

      // ========================================
      // VALIDATION
      // ========================================

      const hasUsefulData =
        parsedResume.contact.name ||
        parsedResume.contact.email ||
        parsedResume.contact.phone ||
        parsedResume.summary ||
        parsedResume.experience.length ||
        parsedResume.education.length ||
        parsedResume.skills.length;

      if (!hasUsefulData) {
        throw new Error(
          "We extracted the file successfully, but couldn't identify the resume information. Please try a different resume format.",
        );
      }

      // ========================================
      // SAVE RESUME
      // ========================================

      const data = JSON.stringify(parsedResume);

      /*
       * Save using both keys for now.
       *
       * Once we see your Editor.jsx,
       * we can keep only the exact key
       * your editor uses.
       */

      localStorage.setItem("resumeData", data);

      localStorage.setItem("cvData", data);

      // ========================================
      // SUCCESS
      // ========================================

      setStatus("success");

      // ========================================
      // OPEN EDITOR
      // ========================================

      setTimeout(() => {
        navigate("/editor");
      }, 1200);
    } catch (err) {
      console.error("IMPORT ERROR:", err);

      setStatus("idle");

      setError(
        err?.message || "Something went wrong while importing your resume.",
      );
    }
  };

  // ========================================
  // FILE INPUT
  // ========================================

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];

    handleFile(file);

    // Allow same file to be selected again
    event.target.value = "";
  };

  // ========================================
  // DRAG OVER
  // ========================================

  const handleDragOver = (event) => {
    event.preventDefault();

    setIsDragging(true);
  };

  // ========================================
  // DRAG LEAVE
  // ========================================

  const handleDragLeave = (event) => {
    event.preventDefault();

    setIsDragging(false);
  };

  // ========================================
  // DROP
  // ========================================

  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    handleFile(file);
  };

  // ========================================
  // OPEN FILE SELECTOR
  // ========================================

  const openFileSelector = () => {
    if (status !== "idle") {
      return;
    }

    fileInputRef.current?.click();
  };

  // ========================================
  // COMPONENT
  // ========================================

  return (
    <div
      className="flex min-h-screen bg-[#F8FAFC]"
      style={{
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* SIDEBAR */}

      <Sidebar />

      {/* MAIN */}

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
            {/* DROP AREA */}

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileSelector}
              className={`
                border-2
                border-dashed
                rounded-2xl
                p-10
                text-center
                transition-all
                ${status === "idle" ? "cursor-pointer" : "cursor-default"}
                ${
                  isDragging
                    ? "border-[#2563EB] bg-[#EFF6FF]"
                    : "border-[#CBD5E1] hover:border-[#2563EB] hover:bg-[#F8FAFC]"
                }
              `}
            >
              {/* FILE INPUT */}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleInputChange}
                className="hidden"
              />

              {/* ================================= */}
              {/* IDLE */}
              {/* ================================= */}

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

              {/* ================================= */}
              {/* EXTRACTING */}
              {/* ================================= */}

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

              {/* ================================= */}
              {/* PARSING */}
              {/* ================================= */}

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

              {/* ================================= */}
              {/* SUCCESS */}
              {/* ================================= */}

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

            {/* ================================= */}
            {/* ERROR */}
            {/* ================================= */}

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                <p className="text-xs text-[#DC2626]">{error}</p>
              </div>
            )}

            {/* ================================= */}
            {/* INFO CARDS */}
            {/* ================================= */}

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

          {/* FOOTER */}

          <p className="text-center text-[10px] text-[#94A3B8] mt-5">
            Supported formats: PDF, DOCX and TXT
          </p>
        </div>
      </main>
    </div>
  );
};

export default ImportResume;
