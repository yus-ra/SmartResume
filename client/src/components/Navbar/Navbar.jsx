import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" rx="7" fill="#2563EB" />
    <rect x="7" y="8" width="14" height="2" rx="1" fill="white" />
    <rect x="7" y="13" width="10" height="2" rx="1" fill="white" />
    <rect x="7" y="18" width="12" height="2" rx="1" fill="white" />
    <circle cx="21" cy="19" r="4" fill="#14B8A6" />
    <path
      d="M19.5 19l1 1 2-2"
      stroke="white"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor:
          scrolled || !isLanding ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom:
          scrolled || !isLanding
            ? "1px solid #E2E8F0"
            : "1px solid transparent",
        boxShadow:
          scrolled || !isLanding ? "0 1px 24px rgba(37,99,235,0.06)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-[#0F172A] text-lg"
        >
          <LogoIcon />
          <span>
            Smart<span style={{ color: "#2563EB" }}>Resume</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475569]">
          <a
            href="/#features"
            className="hover:text-[#2563EB] transition-colors"
          >
            Features
          </a>
          <a href="/#how" className="hover:text-[#2563EB] transition-colors">
            How it Works
          </a>
          <a
            href="/#testimonials"
            className="hover:text-[#2563EB] transition-colors"
          >
            Testimonials
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold text-[#475569] hover:text-[#2563EB] transition-colors px-4 py-2 rounded-lg hover:bg-[#EFF6FF]"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
          >
            Register
          </Link>
        </div>

        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-0.5 bg-[#0F172A] transition-all duration-200"
            style={{
              transform: menuOpen ? "rotate(45deg) translateY(8px)" : "none",
            }}
          />
          <span
            className="block w-5 h-0.5 bg-[#0F172A] transition-all duration-200"
            style={{ opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-0.5 bg-[#0F172A] transition-all duration-200"
            style={{
              transform: menuOpen ? "rotate(-45deg) translateY(-8px)" : "none",
            }}
          />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E2E8F0] px-6 py-4 flex flex-col gap-3">
          <a href="/#features" className="text-sm font-medium text-[#475569]">
            Features
          </a>
          <a href="/#how" className="text-sm font-medium text-[#475569]">
            How it Works
          </a>
          <div className="flex gap-3 mt-2">
            <Link
              to="/login"
              className="flex-1 text-sm font-semibold border border-[#E2E8F0] text-[#475569] py-2 rounded-xl text-center"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="flex-1 text-sm font-semibold text-white py-2 rounded-xl text-center"
              style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
