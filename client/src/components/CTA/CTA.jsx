import { Link } from "react-router-dom";
const CTA = () => {
    return (
        <div className="py-16 px-6">
            <div
                className="max-w-4xl mx-auto rounded-3xl p-10 text-center relative overflow-hidden"
                style={{ background: "linear-gradient(135deg,#1E40AF,#2563EB,#0F766E)" }}
            >
                <div
                    className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #14B8A6 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)" }}
                />
                <div className="relative z-10">
                    <h2 className="font-extrabold text-white text-2xl md:text-3xl mb-3">
                        Ready to Land Your Dream Job?
                    </h2>
                    <p className="text-blue-100 text-sm mb-7 max-w-sm mx-auto">
                        Join over 250,000 professionals who built their career with SmartResume. It&apos;s free to start.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link
                            to="/register"
                            className="bg-white text-[#2563EB] font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm shadow-lg"
                        >
                            Create Free Resume →
                        </Link>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default CTA