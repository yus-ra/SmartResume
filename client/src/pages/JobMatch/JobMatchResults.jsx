import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Sidebar from "../../components/Navbar/Sidebar";
import { explainMatch } from "../../lib/api";

const JobMatchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, jobTitle, company, jobDescription } = location.state || {};

  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  const requestExplanation = async () => {
    if (!analysis) return;

    setLoading(true);
    setError(null);
    setUnavailable(false);

    const result = await explainMatch({
      jobTitle: jobTitle || "",
      company: company || "",
      jobDescription: jobDescription || "",
      matchScore: analysis.overallScore,
      matchedSkills: analysis.matchedKeywords || [],
      missingSkills: analysis.missingKeywords || [],
    });

    if (!result.ok) {
      if (result.status === 503 && result.error === "ai_unavailable") {
        setUnavailable(true);
      } else {
        setError(result.message || "Could not load AI explanation.");
      }
      setLoading(false);
      return;
    }

    setExplanation(result.data?.explanation || null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="ml-60 min-h-screen">
        <header className="bg-white border-b border-gray-100">
          <div className="px-12 py-8 flex items-center justify-between">
            <div>
              <Link
                to="/job-match"
                className="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                ← Back to Job Match
              </Link>

              <div className="mt-6">
                <p className="text-sm text-blue-600 font-semibold mb-2">
                  JOB MATCH ANALYSIS
                </p>

                <h1 className="text-3xl font-bold text-gray-900">
                  Job Match Results
                </h1>
                {jobTitle && (
                  <p className="text-sm text-gray-500 mt-1">
                    Position:{" "}
                    <span className="font-semibold text-gray-800">
                      {jobTitle}
                    </span>{" "}
                    {company ? `at ${company}` : ""}
                  </p>
                )}
              </div>
            </div>

            {analysis && (
              <button
                onClick={() => navigate("/job-match")}
                className="px-5 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 text-sm transition-all"
              >
                New Match
              </button>
            )}
          </div>
        </header>

        <main className="px-12 py-10">
          <div className="max-w-[1400px] mx-auto">
            {!analysis ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 flex items-center justify-center text-4xl mb-6">
                  🎯
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                  No job match analysis found
                </h2>

                <p className="max-w-xl mx-auto text-gray-500 mt-3 leading-7">
                  Results are not saved between visits yet. Go to Job Match to
                  analyse a job description against your resume.
                </p>

                <div className="flex justify-center mt-8">
                  <Link
                    to="/job-match"
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm transition-all"
                  >
                    Go to Job Match
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Score Summary */}
                <div className="bg-white border border-gray-100 rounded-3xl p-8 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">
                      Overall Match Score
                    </p>
                    <h2 className="text-4xl font-extrabold text-gray-900">
                      {analysis.overallScore}%
                    </h2>
                  </div>
                  <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-600 flex items-center justify-center text-blue-600 font-bold text-2xl">
                    {analysis.overallScore}%
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Matched Keywords */}
                  <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Matched Skills & Keywords
                    </h3>
                    {analysis.matchedKeywords?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.matchedKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No overlapping skills detected.
                      </p>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Recommendations
                    </h3>
                    <ul className="space-y-3">
                      {analysis.recommendations?.map((rec, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-gray-600 leading-6"
                        >
                          <span className="text-green-600 font-bold mt-0.5">
                            ✓
                          </span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* AI Explanation */}
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">
                        AI Explanation
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Advisory commentary on your match result. The score above
                        is computed deterministically and is the source of truth.
                      </p>
                    </div>
                  </div>

                  {!explanation && !loading && !error && !unavailable && (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500 mb-5">
                        Get a plain-language explanation of why your resume
                        matches (or does not match) this job.
                      </p>
                      <button
                        type="button"
                        onClick={requestExplanation}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition"
                      >
                        <Sparkles size={18} />
                        Explain my match
                      </button>
                    </div>
                  )}

                  {loading && (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                      <span className="ml-3 text-sm text-gray-500">
                        Generating explanation...
                      </span>
                    </div>
                  )}

                  {unavailable && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                      <p className="text-sm font-semibold text-amber-800">
                        AI explanation is not available.
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        The AI service is not configured on this server. Your
                        deterministic match score and recommendations above are
                        still fully available.
                      </p>
                    </div>
                  )}

                  {error && !loading && (
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                        <p className="text-sm font-semibold text-red-800">
                          Could not load explanation.
                        </p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                      <button
                        type="button"
                        onClick={requestExplanation}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {explanation && !loading && (
                    <div className="space-y-5">
                      <div className="prose prose-sm prose-gray max-w-none text-gray-700 leading-7 whitespace-pre-wrap">
                        {explanation}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setExplanation(null);
                          requestExplanation();
                        }}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Regenerate
                      </button>
                    </div>
                  )}
                </section>

                <div className="flex justify-end gap-3 pt-4">
                  <Link
                    to="/job-match"
                    className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Analyze Another Job
                  </Link>
                  <Link
                    to="/editor"
                    className="px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 text-sm"
                  >
                    Edit Resume
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobMatchResults;
