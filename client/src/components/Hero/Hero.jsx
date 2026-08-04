import React from 'react'

const Hero = () => {
    return (
        <div className="relative pt-28 pb-20 px-6 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(ellipse at center,#2563EB 0%,#14B8A6 50%,transparent 70%)", filter: "blur(80px)" }} />
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 pointer-events-none" style={{ background: "#14B8A6", filter: "blur(60px)" }} />

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
                <div>
                    <div className="inline-flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                        AI-Powered · ATS-Optimized · Free to Start
                    </div>
                    <h1 className="font-extrabold text-[#0F172A] leading-tight mb-5" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
                        Create Professional<br />Resumes{" "}
                        <span style={{ background: "linear-gradient(90deg,#2563EB,#14B8A6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Powered by AI
                        </span>
                    </h1>
                    <p className="text-[#475569] text-base leading-relaxed mb-8 max-w-md">
                        Build ATS-friendly resumes and beautiful portfolios that help you stand out in today&apos;s job market. Get hired faster with smart, data-driven insights.
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
                        {[{ icon: "🔒", label: "No credit card" }, { icon: "⚡", label: "Ready in 5 min" }, { icon: "✅", label: "ATS guaranteed" }].map(({ icon, label }) => (
                            <div key={label} className="flex items-center gap-1.5"><span>{icon}</span><span>{label}</span></div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center"><ResumeIllustration /></div>
            </div>
        </div>
    )
}

export default Hero
