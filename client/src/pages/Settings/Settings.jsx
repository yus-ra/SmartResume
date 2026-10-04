import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ShieldCheck,
  Palette,
  AlertTriangle,
  LogOut,
  Check,
} from "lucide-react";

import Sidebar from "../../components/Navbar/Sidebar";
import { useAuth } from "../../context/AuthContext";

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10";

const labelClass =
  "block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wide";

const cardClass = "bg-white rounded-2xl border border-[#E2E8F0] shadow-sm";

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();

  // ========================================
  // PROFILE FORM
  //
  // This is AUTH profile data. It is stored under
  // the auth session key only, and this page has
  // no knowledge of resume or portfolio storage.
  // ========================================

  /*
   * Seeded once from the signed-in user.
   *
   * No resync effect is used on purpose: the values saved by handleSave are
   * exactly the values held in this form, and `/settings` is unreachable
   * while signed out, so there is no other flow that can change `user` from
   * underneath this form.
   */
  const [form, setForm] = useState(() => ({
    firstName: user?.firstName || "",
    surname: user?.surname || "",
    email: user?.email || "",
  }));

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!saved) {
      return;
    }

    const timer = setTimeout(() => setSaved(false), 2500);

    return () => clearTimeout(timer);
  }, [saved]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setSaved(false);
    setError("");
  };

  const handleSave = (event) => {
    event.preventDefault();

    // ========================================
    // VALIDATION
    // ========================================

    const firstName = form.firstName.trim();
    const email = form.email.trim();

    if (!firstName) {
      setError("First name is required.");
      return;
    }

    if (!email) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    // ========================================
    // SAVE
      // Casing is never altered: only the values
    // are trimmed.
    // ========================================

    updateProfile({
      firstName,
      surname: form.surname.trim(),
      email,
    });

    setError("");
    setSaved(true);
  };

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  const accountRows = [
    { label: "Full name", value: user?.fullName || "—" },
    { label: "Email", value: user?.email || "—" },
    { label: "User ID", value: user?.id || "—" },
    { label: "Stored in", value: "smartresume_user" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 md:ml-60">
        <div className="p-6 md:p-10 max-w-[1500px] mx-auto">
          {/* ========================================
              PAGE HEADER
              ======================================== */}

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-[#0F172A]">Settings</h1>

            <p className="text-sm text-[#64748B] mt-1">
              Manage your profile and your session.
            </p>
          </div>

          <div className="max-w-3xl flex flex-col gap-6">
            {/* ========================================
                PROFILE
                ======================================== */}

            <section className={`${cardClass} p-6 md:p-8`}>
              <div className="flex items-center gap-3 mb-1">
                <User size={18} className="text-[#2563EB]" />

                <h2 className="text-lg font-bold text-[#0F172A]">Profile</h2>
              </div>

              <p className="text-sm text-[#64748B] mb-6">
                Manage the profile information used by your SmartResume
                account.
              </p>

              <form onSubmit={handleSave} className="flex flex-col gap-5">
                {error && (
                  <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertTriangle size={16} />

                    <span>{error}</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass} htmlFor="firstName">
                      First Name
                    </label>

                    <input
                      id="firstName"
                      type="text"
                      className={inputClass}
                      value={form.firstName}
                      onChange={handleChange("firstName")}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="surname">
                      Surname
                    </label>

                    <input
                      id="surname"
                      type="text"
                      className={inputClass}
                      value={form.surname}
                      onChange={handleChange("surname")}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="email">
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={handleChange("email")}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <button
                    type="submit"
                    className="font-semibold text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 text-sm"
                    style={{
                      background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
                    }}
                  >
                    Save Changes
                  </button>

                  {saved && (
                    <span className="text-sm text-[#22C55E] flex items-center gap-1.5">
                      <Check size={16} />

                      Profile saved
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#94A3B8]">
                  Profile changes are saved locally in this browser and are
                  not yet synced to a server.
                </p>
              </form>
            </section>

            {/* ========================================
                ACCOUNT
                ======================================== */}

            <section className={`${cardClass} p-6 md:p-8`}>
              <div className="flex items-center gap-3 mb-1">
                <ShieldCheck size={18} className="text-[#2563EB]" />

                <h2 className="text-lg font-bold text-[#0F172A]">Account</h2>
              </div>

              <p className="text-sm text-[#64748B] mb-6">
                Information available for your current session.
              </p>

              <dl className="flex flex-col">
                {accountRows.map(({ label, value }, index) => (
                  <div
                    key={label}
                    className={`flex flex-wrap items-center justify-between gap-3 py-3.5 ${
                      index === accountRows.length - 1
                        ? ""
                        : "border-b border-[#E2E8F0]"
                    }`}
                  >
                    <dt className="text-sm text-[#64748B]">{label}</dt>

                    <dd className="text-sm font-medium text-[#0F172A] text-right break-all">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ========================================
                APPEARANCE
                ======================================== */}

            <section className={`${cardClass} p-6 md:p-8`}>
              <div className="flex items-center gap-3 mb-1">
                <Palette size={18} className="text-[#94A3B8]" />

                <h2 className="text-lg font-bold text-[#0F172A]">
                  Appearance
                </h2>
              </div>

              <p className="text-sm text-[#64748B]">
                Appearance preferences are not available yet.
              </p>

              <p className="text-xs text-[#94A3B8] mt-2">
                Theme selection and other display settings will appear here
                once they are supported.
              </p>
            </section>

            {/* ========================================
                DANGER ZONE
                ======================================== */}

            <section className="bg-white rounded-2xl border border-[#FECACA] shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-1">
                <AlertTriangle size={18} className="text-[#EF4444]" />

                <h2 className="text-lg font-bold text-[#0F172A]">
                  Danger Zone
                </h2>
              </div>

              <p className="text-sm text-[#64748B]">
                Logging out will not delete your resumes or portfolio data.
              </p>

              {confirmLogout ? (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="font-semibold text-white px-5 py-2.5 rounded-xl text-sm shadow-md transition-all hover:-translate-y-0.5"
                    style={{ background: "#EF4444" }}
                    onClick={handleLogout}
                  >
                    Yes, log me out
                  </button>

                  <button
                    type="button"
                    className="font-medium text-[#475569] px-5 py-2.5 rounded-xl text-sm border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all"
                    onClick={() => setConfirmLogout(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="mt-5 inline-flex items-center gap-2 font-semibold text-[#EF4444] border border-[#FECACA] bg-[#FEF2F2] px-5 py-2.5 rounded-xl text-sm hover:bg-[#FEE2E2] transition-all"
                  onClick={() => setConfirmLogout(true)}
                >
                  <LogOut size={16} />

                  Log Out
                </button>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;