import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoIcon } from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import { forgotPassword } from "../../lib/api";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Main form states
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    const result = await login({
      email: form.email.trim(),
      password: form.password,
    });

    if (!result.ok) {
      setLoading(false);
      setError(
        result.fields?.password ||
          result.message ||
          "We couldn't sign you in. Please try again.",
      );
      return;
    }

    navigate("/dashboard");
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();

    const email = resetEmail.trim();

    if (!email) {
      setResetError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResetError("Enter a valid email address.");
      return;
    }

    setResetError("");
    setResetMessage("");
    setResetLoading(true);

    // Call the API function which returns a result object
    const result = await forgotPassword(email);

    setResetLoading(false);

    if (!result.ok) {
      setResetError(
        result.message || "Could not request a reset. Please try again.",
      );
      return;
    }

    // Success message
    setResetMessage(
      "If an account with that email exists, a reset link has been sent. Check your server console!",
    );
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetEmail("");
    setResetMessage("");
    setResetError("");
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Left panel — decorative */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg,#0F172A 0%,#1E3A8A 60%,#0F766E 100%)",
        }}
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
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-white text-lg relative z-10"
        >
          <LogoIcon />
          <span>
            <span className="font-extrabold tracking-tight text-white">
              Smart
            </span>
            <span className="font-extrabold tracking-tight text-[#5EEAD4]">
              Resume
            </span>
          </span>
        </Link>

        {/* Quote */}
        <div className="relative z-10">
          <div className="text-4xl font-extrabold text-white leading-tight mb-4">
            Your dream job
            <br />
            is one resume
            <br />
            <span style={{ color: "#14B8A6" }}>away.</span>
          </div>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            Join 250,000+ professionals who landed their next role with
            SmartResume&apos;s AI-powered tools.
          </p>

          {/* Testimonial card */}
          <div className="mt-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
            <div className="flex gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-[#F59E0B] text-sm">
                  ★
                </span>
              ))}
            </div>
            <p className="text-white text-sm leading-relaxed mb-4">
              &ldquo;SmartResume boosted my ATS score from 58% to 96%. Got my
              Google offer within 2 weeks!&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white text-xs font-bold">
                SC
              </div>
              <div>
                <div className="text-white text-xs font-semibold">
                  Sarah Chen
                </div>
                <div className="text-blue-300 text-[10px]">
                  Software Engineer at Google
                </div>
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
            <div
              key={label}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center"
            >
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
          <Link
            to="/"
            className="flex lg:hidden items-center gap-2 font-bold text-[#0F172A] text-base mb-8"
          >
            <LogoIcon />
            <span>
              <span className="font-extrabold tracking-tight text-[#2563EB]">
                Smart
              </span>
              <span className="font-extrabold tracking-tight text-[#0F766E]">
                Resume
              </span>
            </span>
          </Link>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
            <h1 className="font-extrabold text-[#0F172A] text-2xl mb-1">
              Welcome Back 👋
            </h1>
            <p className="text-[#94A3B8] text-sm mb-7">
              Sign in to continue building your career.
            </p>

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
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(true);
                      setResetEmail(form.email);
                    }}
                    className="text-xs text-[#2563EB] font-medium hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
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
                style={{
                  background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Login →"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[#94A3B8] mt-6">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="text-[#2563EB] font-semibold hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ===========================================================
          FORGOT PASSWORD MODAL
      =========================================================== */}

      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeResetModal}
        >
          <div
            className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0F172A]">
                Reset your password
              </h2>
              <button
                onClick={closeResetModal}
                className="text-[#94A3B8] hover:text-[#475569] text-sm w-7 h-7 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[#64748B] mb-5">
              Enter the email associated with your account and we will send you
              a link to reset your password.
            </p>

            {resetMessage && (
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-sm px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
                <span>✓</span>
                <span>{resetMessage}</span>
              </div>
            )}

            {resetError && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-sm px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
                <span>⚠</span>
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="jordan@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  autoFocus
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full font-semibold text-white py-3 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
                }}
              >
                {resetLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>

            <p className="text-center text-xs text-[#94A3B8] mt-5">
              Remember your password?{" "}
              <button
                type="button"
                onClick={closeResetModal}
                className="text-[#2563EB] font-semibold hover:underline"
              >
                Back to login
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
