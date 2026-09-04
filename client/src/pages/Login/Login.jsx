import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { LogoIcon } from "../../components/Navbar/Navbar"

const Login = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: "", password: "" })
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.email || !form.password) {
            setError("Please fill in all fields.")
            return
        }
        setError("")
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            navigate("/dashboard")
        }, 1200)
    }

    return (
        <div className="min-h-screen flex" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Left panel — decorative */}
            <div
                className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
                style={{ background: "linear-gradient(145deg,#0F172A 0%,#1E3A8A 60%,#0F766E 100%)" }}
            >
                {/* Blob */}
                <div
                    className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20"
                    style={{ background: "#14B8A6", filter: "blur(80px)" }}
                />
                <div
                    className="absolute bottom-10 right-0 w-64 h-64 rounded-full opacity-10"
                    style={{ background: "#2563EB", filter: "blur(60px)" }}
                />

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 font-bold text-white text-lg relative z-10">
                    <LogoIcon />
                    <span>Smart<span style={{ color: "#14B8A6" }}>Resume</span></span>
                </Link>

                {/* Quote */}
                <div className="relative z-10">
                    <div className="text-4xl font-extrabold text-white leading-tight mb-4">
                        Your dream job<br />
                        is one resume<br />
                        <span style={{ color: "#14B8A6" }}>away.</span>
                    </div>
                    <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
                        Join 250,000+ professionals who landed their next role with SmartResume&apos;s AI-powered tools.
                    </p>

                    {/* Testimonial card */}
                    <div className="mt-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
                        <div className="flex gap-1 mb-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className="text-[#F59E0B] text-sm">★</span>
                            ))}
                        </div>
                        <p className="text-white text-sm leading-relaxed mb-4">
                            &ldquo;SmartResume boosted my ATS score from 58% to 96%. Got my Google offer within 2 weeks!&rdquo;
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white text-xs font-bold">
                                SC
                            </div>
                            <div>
                                <div className="text-white text-xs font-semibold">Sarah Chen</div>
                                <div className="text-blue-300 text-[10px]">Software Engineer at Google</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom stat chips */}
                <div className="relative z-10 flex gap-4">
                    {[
                        { val: "250K+", label: "Users" },
                        { val: "94%", label: "ATS Rate" },
                        { val: "4.9★", label: "Rating" },
                    ].map(({ val, label }) => (
                        <div key={label} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center">
                            <div className="text-white font-bold text-sm">{val}</div>
                            <div className="text-blue-300 text-[10px]">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F8FAFC]">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <Link to="/" className="flex lg:hidden items-center gap-2 font-bold text-[#0F172A] text-base mb-8">
                        <LogoIcon />
                        <span>Smart<span style={{ color: "#2563EB" }}>Resume</span></span>
                    </Link>

                    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
                        <h1 className="font-extrabold text-[#0F172A] text-2xl mb-1">Welcome Back 👋</h1>
                        <p className="text-[#94A3B8] text-sm mb-7">Sign in to continue building your career.</p>

                        {error && (
                            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
                                <span>⚠</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wide">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="jordan@email.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">
                                        Password
                                    </label>
                                    <button type="button" className="text-xs text-[#2563EB] font-medium hover:underline">
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] text-sm"
                                    >
                                        {showPass ? "🙈" : "👁"}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full font-semibold text-white py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Signing in…
                                    </>
                                ) : "Login →"}
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-[#E2E8F0]" />
                                <span className="text-xs text-[#94A3B8]">or continue with</span>
                                <div className="flex-1 h-px bg-[#E2E8F0]" />
                            </div>

                            {/* OAuth stubs */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: "G", label: "Google", bg: "#fff" },
                                    { icon: "in", label: "LinkedIn", bg: "#fff" },
                                ].map(({ icon, label }) => (
                                    <button
                                        key={label}
                                        type="button"
                                        className="flex items-center justify-center gap-2 border border-[#E2E8F0] rounded-xl py-2.5 text-sm font-medium text-[#475569] hover:border-[#2563EB]/40 hover:bg-[#EFF6FF] transition-all"
                                    >
                                        <span className="font-bold text-base">{icon}</span>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </form>

                        <p className="text-center text-sm text-[#94A3B8] mt-6">
                            Don&apos;t have an account?{" "}
                            <Link to="/register" className="text-[#2563EB] font-semibold hover:underline">
                                Register
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
