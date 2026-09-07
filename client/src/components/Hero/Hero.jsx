import { Link } from "react-router-dom";
const ResumeIllustration = () => (
  <div className="relative w-full max-w-lg mx-auto select-none">
    <div
      className="absolute -top-6 -right-6 w-48 h-36 rounded-2xl shadow-xl"
      style={{
        background: "linear-gradient(135deg,#14B8A6,#2563EB)",
        opacity: 0.15,
      }}
    />
    <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-[#E2E8F0]">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white font-bold text-xl">
          JD
        </div>
        <div>
          <div className="font-bold text-[#0F172A] text-lg leading-tight">
            Jordan Davis
          </div>
          <div className="text-[#475569] text-sm">Senior Product Designer</div>
          <div className="text-[#94A3B8] text-xs mt-0.5">
            jordan@email.com · San Francisco, CA
          </div>
        </div>
        <div className="ml-auto flex flex-col items-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm text-white"
            style={{
              background: "conic-gradient(#22C55E 310deg, #E2E8F0 0deg)",
            }}
          >
            <span className="bg-white rounded-full w-10 h-10 flex items-center justify-center text-[#22C55E] font-bold text-xs">
              92%
            </span>
          </div>
          <div className="text-[10px] text-[#94A3B8] mt-1">ATS Score</div>
        </div>
      </div>
      <div className="h-px bg-[#E2E8F0] mb-4" />
      <div className="mb-4">
        <div className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-3">
          Skills
        </div>
        {[
          { label: "Figma / Sketch", pct: 95, color: "#2563EB" },
          { label: "User Research", pct: 88, color: "#14B8A6" },
          { label: "React / TypeScript", pct: 72, color: "#F59E0B" },
        ].map(({ label, pct, color }) => (
          <div key={label} className="mb-2">
            <div className="flex justify-between text-xs text-[#475569] mb-1">
              <span>{label}</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-3">
          Experience
        </div>
        {[
          { role: "Lead Product Designer", co: "Stripe · 2022–Present" },
          { role: "UI/UX Designer", co: "Airbnb · 2019–2022" },
        ].map(({ role, co }) => (
          <div key={role} className="flex gap-2 mb-2 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold text-[#0F172A]">{role}</div>
              <div className="text-[11px] text-[#94A3B8]">{co}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="absolute -bottom-4 -left-4 flex items-center gap-2 bg-white rounded-xl shadow-lg px-3 py-2 border border-[#E2E8F0]">
      <span className="text-base">🤖</span>
      <div>
        <div className="text-[10px] font-semibold text-[#0F172A]">
          AI Suggestion
        </div>
        <div className="text-[10px] text-[#22C55E] font-medium">
          +8 ATS points available
        </div>
      </div>
    </div>
    <div className="absolute top-4 -right-10 flex items-center gap-2 bg-[#2563EB] rounded-xl shadow-lg px-3 py-2">
      <span className="text-sm">📥</span>
      <div className="text-[10px] font-semibold text-white">PDF Ready</div>
    </div>
  </div>
);
const Hero = () => {
  return (
    <section className="relative pt-28 pb-20 px-6 overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center,#2563EB 0%,#14B8A6 50%,transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 pointer-events-none"
        style={{ background: "#14B8A6", filter: "blur(60px)" }}
      />

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            AI-Powered · ATS-Optimized · Free to Start
          </div>
          <h1
            className="font-extrabold text-[#0F172A] leading-tight mb-5"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}
          >
            Create Professional
            <br />
            Resumes{" "}
            <span
              style={{
                background: "linear-gradient(90deg,#2563EB,#14B8A6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Powered by AI
            </span>
          </h1>
          <p className="text-[#475569] text-base leading-relaxed mb-8 max-w-md">
            Build ATS-friendly resumes and beautiful portfolios that help you
            stand out in today&apos;s job market. Get hired faster with smart,
            data-driven insights.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-sm"
              style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
            >
              Create Free Resume →
            </Link>
            <button className="flex items-center gap-2 text-[#475569] font-semibold px-6 py-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#2563EB] hover:text-[#2563EB] transition-all text-sm shadow-sm">
              <span className="text-base">▶</span> Watch Demo
            </button>
          </div>
          <div className="mt-8 flex items-center gap-6 text-xs text-[#94A3B8]">
            {[
              { icon: "🔒", label: "No credit card" },
              { icon: "⚡", label: "Ready in 5 min" },
              { icon: "✅", label: "ATS guaranteed" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <ResumeIllustration />
        </div>
      </div>
    </section>
  );
};

export default Hero;
