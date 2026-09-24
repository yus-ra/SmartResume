import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Navbar/Sidebar";

const JobMatchResults = () => {
  const navigate = useNavigate();

  const [job, setJob] = useState(null);

  useEffect(() => {
    const storedJob = localStorage.getItem("jobDescription");

    if (!storedJob) {
      navigate("/job-match");
      return;
    }

    try {
      setJob(JSON.parse(storedJob));
    } catch (error) {
      console.error("Could not read job description:", error);

      navigate("/job-match");
    }
  }, [navigate]);

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-gray-500">Loading job analysis...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="ml-60 min-h-screen">
        <header className="bg-white border-b border-gray-100">
          <div className="px-12 py-8">
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
                {job.title || "Job Match Results"}
              </h1>

              {job.company && (
                <p className="text-gray-500 mt-2">{job.company}</p>
              )}
            </div>
          </div>
        </header>

        <main className="px-12 py-10">
          <div className="max-w-[1400px] mx-auto">
            {/* =================================================
                COMING NEXT
            ================================================= */}

            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 flex items-center justify-center text-4xl mb-6">
                🎯
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                Your job match analysis is ready to be built
              </h2>

              <p className="max-w-xl mx-auto text-gray-500 mt-3 leading-7">
                SmartResume has your resume and the job description. The next
                step is to compare them and generate your match score, skills
                analysis, keyword gaps and recommendations.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
                <Link
                  to="/job-match"
                  className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Change Job
                </Link>

                <Link
                  to="/editor"
                  className="px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800"
                >
                  Edit Resume
                </Link>
              </div>
            </div>

            {/* =================================================
                JOB PREVIEW
            ================================================= */}

            <div className="mt-6 bg-white border border-gray-100 rounded-3xl p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Job Description
              </h2>

              <div className="bg-gray-50 rounded-2xl p-6">
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-7">
                  {job.description}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobMatchResults;
