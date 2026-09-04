import { Link, useLocation } from "react-router-dom"
import {
    LayoutDashboard,
    FileText,
    Sparkles,
    Globe,
    Settings,
    LogOut,
    ChevronDown,
} from "lucide-react"

import { LogoIcon } from "./Navbar"

const navItems = [
    {
        icon: LayoutDashboard,
        label: "Dashboard",
        to: "/dashboard",
    },
    {
        icon: FileText,
        label: "Resume Editor",
        to: "/editor",
    },
    {
        icon: Sparkles,
        label: "AI Analysis",
        to: "/analysis",
    },
    {
        icon: Globe,
        label: "Portfolio",
        to: "/portfolio",
    },
]

const Sidebar = () => {
    const location = useLocation()

    return (
        <aside className="hidden md:flex flex-col w-60 min-h-screen border-r border-[#E2E8F0] bg-white fixed top-0 left-0 bottom-0 z-40">

            {/* Logo */}
            <div className="px-5 pt-6 pb-7">
                <Link
                    to="/"
                    className="flex items-center gap-2.5 font-bold text-[#0F172A] text-base"
                >
                    <LogoIcon />

                    <span>
                        Smart
                        <span className="text-[#2563EB]">
                            Resume
                        </span>
                    </span>
                </Link>
            </div>


            {/* Navigation */}
            <nav className="flex flex-col gap-1 px-3 flex-1">

                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Workspace
                </p>

                {navItems.map(({ icon: Icon, label, to }) => {

                    const active = location.pathname === to

                    return (
                        <Link
                            key={to}
                            to={to}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                    ? "bg-[#EFF6FF] text-[#2563EB]"
                                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                                }`}
                        >

                            <Icon
                                size={18}
                                strokeWidth={active ? 2.2 : 1.8}
                                className={`transition-colors ${active
                                        ? "text-[#2563EB]"
                                        : "text-[#94A3B8] group-hover:text-[#475569]"
                                    }`}
                            />

                            <span className="flex-1">
                                {label}
                            </span>

                            {active && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                            )}

                        </Link>
                    )
                })}

            </nav>


            {/* Bottom Navigation */}
            <div className="px-3 pb-4">

                <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-all"
                >
                    <Settings
                        size={18}
                        strokeWidth={1.8}
                        className="text-[#94A3B8]"
                    />

                    Settings
                </Link>

            </div>


            {/* User Section */}
            <div className="border-t border-[#E2E8F0] p-4">

                <div className="flex items-center gap-3">

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                        JD
                    </div>


                    {/* User Info */}
                    <div className="flex-1 min-w-0">

                        <div className="text-xs font-semibold text-[#0F172A] truncate">
                            Jordan Davis
                        </div>

                        <div className="text-[10px] text-[#94A3B8]">
                            Free Plan
                        </div>

                    </div>


                    {/* Logout */}
                    <Link
                        to="/login"
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-all"
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </Link>

                </div>

            </div>

        </aside>
    )
}

export default Sidebar