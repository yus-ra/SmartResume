// import { Link } from "react-router-dom";

// const Register = () => {
//     return (
//         <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6 py-12">
//             <div className="w-full max-w-md">

//                 {/* Logo */}
//                 <Link
//                     to="/"
//                     className="flex justify-center items-center gap-2 mb-8"
//                 >
//                     <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center">
//                         <span className="text-white font-bold text-lg">S</span>
//                     </div>

//                     <span className="text-2xl font-bold text-[#0F172A]">
//                         Smart<span className="text-[#2563EB]">Resume</span>
//                     </span>
//                 </Link>

//                 {/* Card */}
//                 <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">

//                     <div className="text-center mb-8">
//                         <h1 className="text-2xl font-bold text-[#0F172A]">
//                             Create your account
//                         </h1>

//                         <p className="text-sm text-[#64748B] mt-2">
//                             Start building smarter resumes today.
//                         </p>
//                     </div>

//                     {/* Form */}
//                     <form className="space-y-5">

//                         {/* Name */}
//                         <div>
//                             <label className="block text-sm font-medium text-[#334155] mb-2">
//                                 Full Name
//                             </label>

//                             <input
//                                 type="text"
//                                 placeholder="Enter your full name"
//                                 className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
//                             />
//                         </div>

//                         {/* Email */}
//                         <div>
//                             <label className="block text-sm font-medium text-[#334155] mb-2">
//                                 Email Address
//                             </label>

//                             <input
//                                 type="email"
//                                 placeholder="you@example.com"
//                                 className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
//                             />
//                         </div>

//                         {/* Password */}
//                         <div>
//                             <label className="block text-sm font-medium text-[#334155] mb-2">
//                                 Password
//                             </label>

//                             <input
//                                 type="password"
//                                 placeholder="Create a password"
//                                 className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
//                             />
//                         </div>

//                         {/* Confirm Password */}
//                         <div>
//                             <label className="block text-sm font-medium text-[#334155] mb-2">
//                                 Confirm Password
//                             </label>

//                             <input
//                                 type="password"
//                                 placeholder="Confirm your password"
//                                 className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
//                             />
//                         </div>

//                         {/* Submit */}
//                         <button
//                             type="submit"
//                             className="w-full py-3 rounded-xl text-white font-semibold shadow-sm hover:shadow-md transition-all"
//                             style={{
//                                 background:
//                                     "linear-gradient(135deg, #2563EB, #1D4ED8)",
//                             }}
//                         >
//                             Create Account
//                         </button>
//                     </form>

//                     {/* Login */}
//                     <p className="text-center text-sm text-[#64748B] mt-6">
//                         Already have an account?{" "}
//                         <Link
//                             to="/login"
//                             className="font-semibold text-[#2563EB] hover:underline"
//                         >
//                             Login
//                         </Link>
//                     </p>

//                 </div>
//             </div>
//         </div>
//     );
// }
// export default Register

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { LogoIcon } from "../../components/Navbar/Navbar";
const Register = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" })
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const strength = (() => {
        const p = form.password
        if (!p) return 0
        let s = 0
        if (p.length >= 8) s++
        if (/[A-Z]/.test(p)) s++
        if (/[0-9]/.test(p)) s++
        if (/[^A-Za-z0-9]/.test(p)) s++
        return s
    })()

    const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength]
    const strengthColor = ["", "#EF4444", "#F59E0B", "#14B8A6", "#22C55E"][strength]

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.name || !form.email || !form.password) {
            setError("Please fill in all fields.")
            return
        }
        if (form.password !== form.confirm) {
            setError("Passwords do not match.")
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
            {/* Left decorative panel */}
            <div
                className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
                style={{ background: "linear-gradient(145deg,#0F172A 0%,#1E3A8A 60%,#0F766E 100%)" }}
            >
                <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20" style={{ background: "#14B8A6", filter: "blur(80px)" }} />
                <div className="absolute bottom-10 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "#2563EB", filter: "blur(60px)" }} />

                <Link to="/" className="flex items-center gap-2.5 font-bold text-white text-lg relative z-10">
                    <LogoIcon />
                    <span>Smart<span style={{ color: "#14B8A6" }}>Resume</span></span>
                </Link>

                <div className="relative z-10">
                    <div className="text-4xl font-extrabold text-white leading-tight mb-4">
                        Start your<br />
                        career journey<br />
                        <span style={{ color: "#14B8A6" }}>today.</span>
                    </div>
                    <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
                        Free to start. No credit card required. Build your first ATS-optimized resume in under 5 minutes.
                    </p>

                    {/* Steps preview */}
                    <div className="mt-10 flex flex-col gap-3">
                        {[
                            { n: "01", label: "Create your free account" },
                            { n: "02", label: "Choose a resume template" },
                            { n: "03", label: "Let AI optimize your content" },
                        ].map(({ n, label }) => (
                            <div key={n} className="flex items-center gap-4">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                    style={{ background: "linear-gradient(135deg,#2563EB,#14B8A6)" }}
                                >
                                    {n}
                                </div>
                                <span className="text-white text-sm font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex gap-4">
                    {[{ val: "Free", label: "Forever Plan" }, { val: "5 min", label: "Setup Time" }, { val: "0", label: "Credit Card" }].map(({ val, label }) => (
                        <div key={label} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center">
                            <div className="text-white font-bold text-sm">{val}</div>
                            <div className="text-blue-300 text-[10px]">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F8FAFC]">
                <div className="w-full max-w-md">
                    <Link to="/" className="flex lg:hidden items-center gap-2 font-bold text-[#0F172A] text-base mb-8">
                        <LogoIcon />
                        <span>Smart<span style={{ color: "#2563EB" }}>Resume</span></span>
                    </Link>

                    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
                        <h1 className="font-extrabold text-[#0F172A] text-2xl mb-1">Create Account 🚀</h1>
                        <p className="text-[#94A3B8] text-sm mb-7">Free forever. No credit card required.</p>

                        {error && (
                            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
                                <span>⚠</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wide">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Jordan Davis"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wide">Email</label>
                                <input
                                    type="email"
                                    placeholder="jordan@email.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wide">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        placeholder="Min. 8 characters"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all pr-12"
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm">
                                        {showPass ? "🙈" : "👁"}
                                    </button>
                                </div>
                                {form.password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 h-1 rounded-full transition-all duration-300"
                                                    style={{ backgroundColor: i < strength ? strengthColor : "#E2E8F0" }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-medium" style={{ color: strengthColor }}>{strengthLabel}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wide">Confirm Password</label>
                                <input
                                    type="password"
                                    placeholder="Re-enter password"
                                    value={form.confirm}
                                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
                                    style={{
                                        borderColor: form.confirm && form.confirm !== form.password ? "#EF4444" : undefined,
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full font-semibold text-white py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 text-sm disabled:opacity-70 flex items-center justify-center gap-2 mt-1"
                                style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
                            >
                                {loading ? (
                                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating account…</>
                                ) : "Create Free Account →"}
                            </button>

                            <p className="text-center text-[10px] text-[#94A3B8] leading-relaxed">
                                By registering, you agree to our{" "}
                                <a href="#" className="text-[#2563EB] hover:underline">Terms of Service</a>{" "}
                                and{" "}
                                <a href="#" className="text-[#2563EB] hover:underline">Privacy Policy</a>.
                            </p>
                        </form>

                        <p className="text-center text-sm text-[#94A3B8] mt-5">
                            Already have an account?{" "}
                            <Link to="/login" className="text-[#2563EB] font-semibold hover:underline">Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register