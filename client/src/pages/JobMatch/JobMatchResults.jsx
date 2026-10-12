import { useLocation, Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Navbar/Sidebar";

const JobMatchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, jobTitle, company } = location.state || {};

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
