import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../lib/api";

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Invalid or missing reset token in URL.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    // api.js never throws; it always resolves with { ok, status, data,
    // error, message, fields }. Rely on `ok` rather than try/catch, which
    // would fire on a network failure and falsely claim success.
    const result = await resetPassword(token, password);

    if (!result.ok) {
      setLoading(false);
      setError(
        result.message ||
          result.fields?.password ||
          "Could not reset your password. The link may be invalid or expired.",
      );
      return;
    }

    setSuccess(true);

    setTimeout(() => {
      navigate("/login");
    }, 3000);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 bg-[#F8FAFC]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 sm:p-8">
          <h1 className="font-extrabold text-[#0F172A] text-2xl mb-1">
            Set new password
          </h1>
          <p className="text-[#94A3B8] text-sm mb-6">
            Choose a strong password you have not used here before.
          </p>

          {success && (
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-sm px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
              <span>✓</span>
              <span>
                Password successfully reset! Redirecting to login…
              </span>
            </div>
          )}

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-sm px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {!token ? (
            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-sm px-4 py-3 rounded-xl text-center">
              Missing reset token. Please request a new password reset link.
            </div>
          ) : success ? (
            <p className="text-center text-sm text-[#64748B]">
              You can now sign in with your new password.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wide">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold text-white py-3 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Resetting…
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-[#94A3B8] mt-6">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-[#2563EB] font-semibold hover:underline"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
