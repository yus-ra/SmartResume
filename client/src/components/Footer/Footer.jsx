import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white px-6 py-12">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-0 items-start">
        <div>
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-[#0F172A] text-lg mb-3"
          >
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
            <span>
              Smart<span style={{ color: "#2563EB" }}>Resume</span>
            </span>
          </Link>
          <p className="text-[#94A3B8] text-sm max-w-xs leading-relaxed">
            Create Professional Resumes Powered by AI.
            <br />
            Build ATS-friendly resumes and beautiful portfolios.
          </p>
        </div>
        <div className="flex flex-col md:items-end gap-4">
          <div className="flex flex-wrap gap-6 text-sm font-medium text-[#475569]">
            {["About", "Privacy", "Contact", "GitHub"].map((link) => (
              <a
                key={link}
                href="https://github.com/yus-ra/SmartResume"
                className="hover:text-[#2563EB] transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <div className="text-xs text-[#94A3B8]">
            © 2026 SmartResume · All rights reserved
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
