import { Routes, Route, Navigate } from "react-router-dom";
import App from "../App";
import Register from "../pages/Register/Register";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import ResumeEditor from "../pages/ResumeEditor/ResumeEditor";
import ResumeAnalysis from "../pages/ResumeAnalysis/ResumeAnalysis";
import ImportResume from "../pages/importResume/ImportResume";
import JobMatch from "../pages/JobMatch/JobMatch";
import JobMatchResults from "../pages/JobMatch/JobMatchResults";
import Portfolio from "../pages/Portfolio/Portfolio";
import PublicPortfolio from "../pages/PublicPortfolio/PublicPortfolio";
import Settings from "../pages/Settings/Settings";
import ProtectedRoute from "./ProtectedRoute";
import ResetPassword from "../pages/Auth/ResetPassword";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <ResumeEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis"
        element={
          <ProtectedRoute>
            <ResumeAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/import-resume"
        element={
          <ProtectedRoute>
            <ImportResume />
          </ProtectedRoute>
        }
      />
      <Route
        path="/job-match"
        element={
          <ProtectedRoute>
            <JobMatch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/job-match/results"
        element={
          <ProtectedRoute>
            <JobMatchResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <Portfolio />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/*
        The published portfolio. Deliberately NOT wrapped in ProtectedRoute —
        the entire point is that a recruiter with no SmartResume account can open
        it. Authorisation lives on the server, which only serves a portfolio whose
        owner has switched sharing on.

        Declared before the catch-all below so it is not redirected to the
        landing page.
      */}
      <Route path="/p/:slug" element={<PublicPortfolio />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
