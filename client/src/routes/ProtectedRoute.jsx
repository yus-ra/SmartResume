import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/*
 * While the session is still being resolved the answer is genuinely unknown,
 * so redirecting here would bounce a signed-in user to /login for a frame.
 * Render a neutral placeholder instead and decide once the server has
 * answered.
 */
const SessionPending = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
    <div
      className="w-8 h-8 border-2 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin"
      role="status"
      aria-label="Checking your session"
    />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <SessionPending />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;