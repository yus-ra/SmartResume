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
import Settings from "../pages/Settings/Settings";
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
