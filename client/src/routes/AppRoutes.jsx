import { Routes, Route } from "react-router-dom";
import App from "../App";
import Register from "../pages/Register/Register";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import ResumeEditor from "../pages/ResumeEditor/ResumeEditor";
import ResumeAnalysis from "../pages/ResumeAnalysis/ResumeAnalysis";
import ImportResume from "../pages/importResume/ImportResume";
import JobMatch from "../pages/JobMatch/JobMatch";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/editor" element={<ResumeEditor />} />
      <Route path="/analysis" element={<ResumeAnalysis />} />
      <Route path="/import-resume" element={<ImportResume />} />
      <Route path="/job-match" element={<JobMatch />} />
    </Routes>
  );
};

export default AppRoutes;
