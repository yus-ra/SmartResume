import { Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Sparkles,
  Globe,
  Download,
  Eye,
  ArrowUpRight,
  MoreHorizontal,
  TrendingUp,
  BrainCircuit,
  ChevronRight,
  Clock,
} from "lucide-react";

import Sidebar from "../../components/Navbar/Sidebar";

const resumes = [
  {
    title: "Software Engineer Resume",
    updated: "Updated 2 days ago",
    ats: 92,
    color: "#2563EB",
  },
  {
    title: "Product Manager Resume",
    updated: "Updated 1 week ago",
    ats: 78,
    color: "#14B8A6",
  },
  {
    title: "UX Designer Resume",
    updated: "Updated 3 weeks ago",
    ats: 65,
    color: "#F59E0B",
  },
];

const actions = [
  {
    icon: FileText,
    label: "Create Resume",
    desc: "Build a new professional resume",
    to: "/editor",
  },
  {
    icon: Sparkles,
    label: "AI Analysis",
    desc: "Improve your resume for ATS",
    to: "/analysis",
  },
  {
    icon: Globe,
    label: "Portfolio",
    desc: "Create your professional portfolio",
    to: "/portfolio",
  },
];

function ATSRing({ score, color }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="5"
        />

        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
        />
      </svg>

      <span className="absolute text-xs font-bold" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

const Dashboard = () => {
  const stats = [
    {
      label: "Total Resumes",
      value: "3",
      change: "+1 this month",
      icon: FileText,
    },
    {
      label: "Average ATS Score",
      value: "78%",
      change: "+12% improvement",
      icon: BrainCircuit,
    },
    {
      label: "Downloads",
      value: "14",
      change: "This month",
      icon: Download,
    },
    {
      label: "Portfolio Views",
      value: "231",
      change: "+18.4% this week",
      icon: Eye,
    },
  ];

  return (
    <div
      className="flex min-h-screen bg-[#F8FAFC]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <Sidebar />

      <main className="flex-1 md:ml-60">
        {/* Top Header */}
        <header className="bg-white border-b border-[#E2E8F0]">
          <div className="px-6 md:px-10 py-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#94A3B8] mb-1">
                Dashboard Overview
              </p>

              <h1 className="text-2xl font-bold text-[#0F172A]">
                Welcome back, Jordan
              </h1>
            </div>

            <Link
              to="/editor"
              className="hidden md:flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            >
              <Plus size={17} />
              Create Resume
            </Link>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-[1500px] mx-auto">
          {/* Welcome Banner */}

          <div className="mb-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                  <Sparkles size={16} className="text-[#2563EB]" />
                </div>

                <span className="text-sm font-semibold text-[#2563EB]">
                  SmartResume AI
                </span>
              </div>

              <h2 className="text-lg font-bold text-[#0F172A] mb-1">
                Your resume is almost ready for opportunities.
              </h2>

              <p className="text-sm text-[#64748B]">
                Improve your ATS score and increase your chances of getting
                noticed.
              </p>
            </div>

            <Link
              to="/analysis"
              className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] whitespace-nowrap"
            >
              Analyze Resume
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* Statistics */}

          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0F172A]">Overview</h2>

              <span className="text-xs text-[#94A3B8]">Last updated today</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(({ label, value, change, icon: Icon }) => (
                <div
                  key={label}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#CBD5E1] transition-colors"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                      <Icon size={18} className="text-[#475569]" />
                    </div>

                    <MoreHorizontal size={18} className="text-[#CBD5E1]" />
                  </div>

                  <div className="text-2xl font-bold text-[#0F172A] mb-1">
                    {value}
                  </div>

                  <div className="text-xs text-[#64748B] mb-3">{label}</div>

                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#16A34A]">
                    <TrendingUp size={12} />
                    {change}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}

          <section className="mb-10">
            <h2 className="font-semibold text-[#0F172A] mb-4">Quick Actions</h2>

            <div className="grid md:grid-cols-3 gap-4">
              {actions.map(({ icon: Icon, label, desc, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="group bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#93C5FD] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                      <Icon size={20} className="text-[#2563EB]" />
                    </div>

                    <ChevronRight
                      size={18}
                      className="text-[#CBD5E1] group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all"
                    />
                  </div>

                  <h3 className="font-semibold text-[#0F172A] text-sm mb-1">
                    {label}
                  </h3>

                  <p className="text-xs text-[#64748B]">{desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent Resumes */}

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[#0F172A]">Recent Resumes</h2>

                <p className="text-xs text-[#94A3B8] mt-1">
                  Manage and optimize your resumes
                </p>
              </div>

              <Link
                to="/editor"
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
              {resumes.map(({ title, updated, ats, color }, index) => (
                <div
                  key={title}
                  className={`group flex items-center gap-5 p-5 hover:bg-[#F8FAFC] transition-colors ${
                    index !== resumes.length - 1
                      ? "border-b border-[#F1F5F9]"
                      : ""
                  }`}
                >
                  {/* Resume icon */}

                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${color}12`,
                    }}
                  >
                    <FileText size={19} style={{ color }} />
                  </div>

                  {/* Resume details */}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#0F172A] text-sm">
                      {title}
                    </h3>

                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-[#94A3B8]" />

                      <span className="text-xs text-[#94A3B8]">{updated}</span>
                    </div>
                  </div>

                  {/* ATS Score */}

                  <div className="hidden sm:flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-[#94A3B8]">
                        ATS Score
                      </div>

                      <div className="text-xs font-semibold" style={{ color }}>
                        Resume Match
                      </div>
                    </div>

                    <ATSRing score={ats} color={color} />
                  </div>

                  {/* Actions */}

                  <div className="flex items-center gap-2">
                    <Link
                      to="/editor"
                      className="hidden md:block text-xs font-semibold text-[#475569] hover:text-[#2563EB] px-3 py-2"
                    >
                      Edit
                    </Link>

                    <Link
                      to="/analysis"
                      className="text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] px-3 py-2 rounded-lg hover:bg-[#DBEAFE] transition-colors"
                    >
                      Analyze
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Insight */}

          <section className="mt-8">
            <div className="rounded-2xl bg-[#0F172A] p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles size={22} className="text-[#60A5FA]" />
              </div>

              <div className="flex-1">
                <div className="text-sm font-semibold text-white mb-1">
                  AI Career Insight
                </div>

                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  Your strongest resume has an ATS score of{" "}
                  <span className="text-white font-semibold">92%</span>. Add
                  more measurable achievements to improve your other resumes.
                </p>
              </div>

              <Link
                to="/analysis"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#0F172A] px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#F1F5F9] transition-colors whitespace-nowrap"
              >
                Get AI Insights
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
