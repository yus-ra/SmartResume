import { Link, useLocation } from "react-router-dom";
import { LogoIcon } from "./Navbar"

const navItems = [
    { icon: "🏠", label: "Dashboard", to: "/dashboard" },
    { icon: "📝", label: "Resume Editor", to: "/editor" },
    { icon: "🤖", label: "AI Analysis", to: "/analysis" },
    { icon: "🌐", label: "Portfolio", to: "/portfolio" },
]
const Sidebar = () => {
    const location = useLocation()

    return (
        <aside
            className="hidden md:flex flex-col w-60 min-h-screen border-r border-[#E2E8F0] bg-white py-5 px-3 fixed top-0 left-0 bottom-0"
        >
            <Link to="/" className="flex items-center gap-2.5 font-bold text-[#0F172A] text-base px-3 mb-8">
                <LogoIcon />
                <span>Smart<span style={{ color: "#2563EB" }}>Resume</span></span>
            </Link>

            <nav className="flex flex-col gap-1 flex-1">
                {navItems.map(({ icon, label, to }) => {
                    const active = location.pathname === to
                    return (
                        <Link
                            key={to}
                            to={to}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                            style={{
                                backgroundColor: active ? "#EFF6FF" : "transparent",
                                color: active ? "#2563EB" : "#475569",
                            }}
                        >
                            <span className="text-base">{icon}</span>
                            {label}
                            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2563EB]" />}
                        </Link>
                    )
                })}
            </nav>

            {/* User avatar */}
            <div className="mt-auto px-3 pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white font-bold text-xs">
                        JD
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-[#0F172A]">Jordan Davis</div>
                        <div className="text-[10px] text-[#94A3B8]">Free Plan</div>
                    </div>
                    <Link to="/login" className="ml-auto text-[#94A3B8] hover:text-[#EF4444] text-xs transition-colors" title="Logout">⏏</Link>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar