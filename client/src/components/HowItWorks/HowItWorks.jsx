import { Link } from "react-router-dom";
const steps = [
    { n: 1, label: "Create Account" },
    { n: 2, label: "Build Resume" },
    { n: 3, label: "AI Analysis" },
    { n: 4, label: "Download PDF" },
    { n: 5, label: "Get Hired 🎉" },
]
const HowItWorks = () => {
    return (
        <div id="how" className="py-20 px-6 bg-white border-y border-[#E2E8F0]">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-14">
                    <div className="inline-block text-xs font-semibold text-[#14B8A6] bg-[#F0FDFA] border border-[#99F6E4] px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                        How It Works
                    </div>
                    <h2 className="font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-3">
                        From Zero to Hired in 5 Steps
                    </h2>
                    <p className="text-[#475569] text-base max-w-md mx-auto">
                        Our streamlined process gets you job-ready faster than you think.
                    </p>
                </div>

                <div className="relative flex flex-col md:flex-row gap-8 md:gap-0">
                    <div
                        className="hidden md:block absolute top-6 left-[10%] right-[10%] h-px pointer-events-none"
                        style={{ background: "linear-gradient(90deg,#2563EB40,#14B8A640,#22C55E40,#F59E0B40,#2563EB40)" }}
                    />
                    {steps.map(({ n, label }, i, arr) => (
                        <div key={n} className="relative flex flex-col items-center flex-1 text-center">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-base shadow-md z-10"
                                style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)" }}
                            >
                                {n}
                            </div>
                            <div className="mt-3 text-sm font-semibold text-[#0F172A] leading-tight">{label}</div>
                            {i < arr.length - 1 && (
                                <div className="md:hidden w-px h-6 mt-3" style={{ background: "linear-gradient(180deg,#2563EB40,#14B8A640)" }} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center mt-14">
                    <Link
                        to="/register"
                        className="text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-sm"
                        style={{ background: "linear-gradient(135deg,#14B8A6,#2563EB)" }}
                    >
                        Start Your Journey →
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default HowItWorks