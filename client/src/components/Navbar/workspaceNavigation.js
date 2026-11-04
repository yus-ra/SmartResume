import {
  FileText,
  Globe,
  LayoutDashboard,
  Sparkles,
  Target,
} from "lucide-react";

/** Shared destinations for the desktop sidebar and mobile bottom bar. */
export const workspaceNavigationItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    mobileLabel: "Dashboard",
    to: "/dashboard",
  },
  {
    icon: FileText,
    label: "Resume Editor",
    mobileLabel: "Resume",
    to: "/editor",
  },
  {
    icon: Sparkles,
    label: "AI Analysis",
    mobileLabel: "Analysis",
    to: "/analysis",
  },
  {
    icon: Target,
    label: "Job Match",
    mobileLabel: "Job Match",
    to: "/job-match",
  },
  {
    icon: Globe,
    label: "Portfolio",
    mobileLabel: "Portfolio",
    to: "/portfolio",
  },
];

export function isWorkspaceNavigationItemActive(
  to,
  pathname,
  { includeRelatedRoutes = false } = {},
) {
  if (to === "/job-match") {
    return pathname === to || pathname.startsWith(`${to}/`);
  }

  if (
    includeRelatedRoutes &&
    to === "/editor" &&
    pathname === "/import-resume"
  ) {
    return true;
  }

  return pathname === to;
}
