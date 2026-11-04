import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Settings } from "lucide-react";

import { LogoIcon } from "./Navbar";
import { useAuth } from "../../context/AuthContextValue.js";
import {
  isWorkspaceNavigationItemActive,
  workspaceNavigationItems,
} from "./workspaceNavigation.js";

function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "SR";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

const Sidebar = ({ desktopNav = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const accountButtonRef = useRef(null);

  const fullName = user?.fullName || "SmartResume User";
  const initials = getInitials(fullName);

  useEffect(() => {
    document.body.classList.add("workspace-mobile-nav-active");
    return () => document.body.classList.remove("workspace-mobile-nav-active");
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
        accountButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  const handleLogout = () => {
    setAccountMenuOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="relative z-30 w-full border-b border-[#E2E8F0] bg-white md:hidden">
        <div
          className="flex min-h-14 items-center justify-between gap-2 px-3 py-1.5 sm:px-4"
          style={{
            paddingLeft: "calc(0.75rem + env(safe-area-inset-left, 0px))",
            paddingRight: "calc(0.75rem + env(safe-area-inset-right, 0px))",
          }}
        >
          <Link
            to="/dashboard"
            className="flex min-w-0 items-center gap-2 font-bold text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
          >
            <LogoIcon />
            <span className="truncate text-sm">
              Smart<span className="text-[#2563EB]">Resume</span>
            </span>
          </Link>

          <div ref={accountMenuRef} className="relative flex-shrink-0">
            <button
              ref={accountButtonRef}
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              className="flex min-h-11 max-w-[44vw] items-center gap-2 rounded-xl px-2 text-left text-[#334155] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              aria-label={`Account options for ${fullName}`}
              aria-expanded={accountMenuOpen}
              aria-controls="mobile-account-actions"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] text-[11px] font-semibold text-white">
                {initials}
              </span>
              <span className="max-w-20 truncate text-xs font-semibold sm:max-w-28">
                {fullName}
              </span>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className={`flex-shrink-0 text-[#64748B] transition-transform ${
                  accountMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {accountMenuOpen && (
              <div
                id="mobile-account-actions"
                className="absolute right-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg"
                role="group"
                aria-label="Account actions"
              >
                <p className="truncate px-3 py-2 text-xs font-semibold text-[#64748B]">
                  {fullName}
                </p>
                <Link
                  to="/settings"
                  onClick={() => setAccountMenuOpen(false)}
                  aria-current={
                    location.pathname === "/settings" ? "page" : undefined
                  }
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                    location.pathname === "/settings"
                      ? "bg-[#EFF6FF] text-[#2563EB]"
                      : "text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <Settings size={17} aria-hidden="true" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#B91C1C] hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                >
                  <LogOut size={17} aria-hidden="true" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {desktopNav && (
        <aside className="fixed bottom-0 left-0 top-0 z-40 hidden min-h-screen w-60 flex-col border-r border-[#E2E8F0] bg-white md:flex">
          <div className="px-5 pb-7 pt-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 text-base font-bold text-[#0F172A]"
            >
              <LogoIcon />
              <span>
                Smart
                <span className="text-[#2563EB]">Resume</span>
              </span>
            </Link>
          </div>

          <nav aria-label="Workspace" className="flex flex-1 flex-col gap-1 px-3">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Workspace
            </p>

            {workspaceNavigationItems.map(({ icon: Icon, label, to }) => {
              const active = isWorkspaceNavigationItemActive(
                to,
                location.pathname,
              );

              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-[#EFF6FF] text-[#2563EB]"
                      : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.2 : 1.8}
                    aria-hidden="true"
                    className={`transition-colors ${
                      active
                        ? "text-[#2563EB]"
                        : "text-[#94A3B8] group-hover:text-[#475569]"
                    }`}
                  />
                  <span className="flex-1">{label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 pb-4">
            <Link
              to="/settings"
              aria-current={
                location.pathname === "/settings" ? "page" : undefined
              }
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                location.pathname === "/settings"
                  ? "bg-[#EFF6FF] text-[#2563EB]"
                  : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              }`}
            >
              <Settings
                size={18}
                strokeWidth={location.pathname === "/settings" ? 2.2 : 1.8}
                aria-hidden="true"
                className={
                  location.pathname === "/settings"
                    ? "text-[#2563EB]"
                    : "text-[#94A3B8]"
                }
              />
              <span className="flex-1">Settings</span>
              {location.pathname === "/settings" && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              )}
            </Link>
          </div>

          <div className="border-t border-[#E2E8F0] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] text-xs font-semibold text-white shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-[#0F172A]">
                  {fullName}
                </div>
                <div className="text-[10px] text-[#94A3B8]">Free Plan</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-[#94A3B8] transition-all hover:bg-[#FEF2F2] hover:text-[#EF4444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>
      )}

      <nav
        aria-label="Primary mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E2E8F0] bg-white/95 px-1 pt-1.5 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
        style={{
          paddingLeft: "calc(0.25rem + env(safe-area-inset-left, 0px))",
          paddingRight: "calc(0.25rem + env(safe-area-inset-right, 0px))",
          paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="mx-auto flex max-w-xl items-stretch justify-around">
          {workspaceNavigationItems.map(
            ({ icon: Icon, label, mobileLabel, to }) => {
              const active = isWorkspaceNavigationItemActive(
                to,
                location.pathname,
                { includeRelatedRoutes: true },
              );

              return (
                <Link
                  key={to}
                  to={to}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  title={label}
                  className={`relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] font-medium leading-tight focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB] ${
                    active
                      ? "bg-[#EFF6FF] text-[#2563EB]"
                      : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.2 : 1.8}
                    aria-hidden="true"
                  />
                  <span className="whitespace-nowrap">{mobileLabel}</span>
                  <span
                    aria-hidden="true"
                    className={`h-1 w-1 rounded-full ${
                      active ? "bg-[#2563EB]" : "bg-transparent"
                    }`}
                  />
                </Link>
              );
            },
          )}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
