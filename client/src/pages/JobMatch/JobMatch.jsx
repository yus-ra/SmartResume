import { useState } from "react";
import { Link } from "react-router-dom";

const JobMatch = () => {
  const [jobDescription, setJobDescription] = useState("");

  const [jobTitle, setJobTitle] = useState("");

  const [company, setCompany] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [error, setError] = useState("");

  const handleAnalyze = () => {
    setError("");

    if (!jobDescription.trim()) {
      setError("Please paste the job description before analyzing.");
      return;
    }

    if (jobDescription.trim().length < 50) {
      setError(
        "The job description is too short. Please paste the complete job description.",
      );
      return;
    }

    setIsAnalyzing(true);

    /*
      For now, we are only preparing the job-match
      workflow.

      The actual matching engine will be added in
      Stage 2B.
    */

    const jobData = {
      title: jobTitle.trim(),
      company: company.trim(),
      description: jobDescription.trim(),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("jobDescription", JSON.stringify(jobData));

    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1000);
  };

  const handleClear = () => {
    setJobTitle("");
    setCompany("");
    setJobDescription("");
    setError("");

    localStorage.removeItem("jobDescription");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <Link
            to="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            ← Dashboard
          </Link>

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Job Match</h1>

            <p className="text-gray-500 mt-2 max-w-2xl">
              Compare your resume with a job description to discover how well
              your experience and skills align with the role.
            </p>
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* =================================================
              JOB DESCRIPTION FORM
          ================================================= */}

          <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-xl">
                🎯
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add a Job Description
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Paste the job posting you want to compare your resume against.
                </p>
              </div>
            </div>

            {/* Job title */}

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Title
                <span className="font-normal text-gray-400"> (optional)</span>
              </label>

              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Junior DevOps Engineer"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
              />
            </div>

            {/* Company */}

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company
                <span className="font-normal text-gray-400"> (optional)</span>
              </label>

              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
              />
            </div>

            {/* Job description */}

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Job Description
                </label>

                <span className="text-xs text-gray-400">
                  {jobDescription.length} characters
                </span>
              </div>

              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={`Paste the full job description here...

Example:

We are looking for a Junior DevOps Engineer to join our engineering team.

Responsibilities:
• Manage cloud infrastructure
• Build and maintain CI/CD pipelines
• Work with Docker and Kubernetes
• Monitor production systems

Requirements:
• Knowledge of AWS
• Experience with Linux
• Familiarity with Git
• Understanding of Terraform
• Strong problem-solving skills`}
                rows={18}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 outline-none resize-y focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition text-sm leading-6"
              />
            </div>

            {/* Error */}

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1 bg-gray-900 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isAnalyzing ? "Preparing Analysis..." : "Analyze Job Match →"}
              </button>

              <button
                onClick={handleClear}
                type="button"
                className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                Clear
              </button>
            </div>
          </section>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="space-y-5">
            {/* Resume status */}

            <div className="bg-white border border-gray-100 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  📄
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">Your Resume</h3>

                  <p className="text-xs text-green-600">Ready to analyze</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 leading-6">
                SmartResume will use the resume currently saved in your editor
                when comparing it with the job description.
              </p>

              <Link
                to="/editor"
                className="block text-center mt-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                View / Edit Resume
              </Link>
            </div>

            {/* What you'll get */}

            <div className="bg-gray-900 text-white rounded-3xl p-6">
              <h3 className="font-bold text-lg mb-5">What you'll get</h3>

              <div className="space-y-4">
                <Feature
                  icon="📊"
                  title="Match Score"
                  text="See how closely your resume matches the role."
                />

                <Feature
                  icon="🔑"
                  title="Keywords"
                  text="Identify important keywords found or missing."
                />

                <Feature
                  icon="🛠️"
                  title="Skills"
                  text="Compare your skills with the job requirements."
                />

                <Feature
                  icon="💡"
                  title="Suggestions"
                  text="Get practical recommendations for improving your resume."
                />
              </div>
            </div>

            {/* Tip */}

            <div className="bg-white border border-gray-100 rounded-3xl p-6">
              <div className="text-2xl mb-3">💡</div>

              <h3 className="font-bold text-gray-900 mb-2">Pro tip</h3>

              <p className="text-sm text-gray-500 leading-6">
                Paste the complete job description rather than only the
                requirements. Responsibilities, qualifications and preferred
                skills can all provide useful matching signals.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

/* =========================================================
   FEATURE
========================================================= */

function Feature({ icon, title, text }) {
  return (
    <div className="flex gap-3">
      <div className="text-lg">{icon}</div>

      <div>
        <p className="font-semibold text-sm">{title}</p>

        <p className="text-xs text-gray-400 mt-1 leading-5">{text}</p>
      </div>
    </div>
  );
}

export default JobMatch;
