import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import Register from "./pages/Register.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import Settings from "./pages/Settings.jsx";


// Protected Layout 
const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  // prevents a flash-redirect to /login on page refresh.
  if (loading) return null;

  // No authenticated user → bounce to login
  if (!user) return <Navigate to="/login" replace />;

  return (
    <SocketProvider>
      <ChatProvider>
        <Outlet />
      </ChatProvider>
    </SocketProvider>
  );
};


// Verify-OTP Guard 
const VerifyOtpLayout = () => {
  const verifyToken = localStorage.getItem("verifyToken");

  if (!verifyToken) return <Navigate to="/register" replace />;

  return <Outlet />;
};


// Change-Password Guard 
const ChangePasswordLayout = () => {
  const { user, loading } = useAuth();

  // Same loading guard as ProtectedLayout — wait for rehydration
  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};


function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>

            {/* ── Fully Public Routes ── */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Semi-Public: requires verifyToken from registration flow ── */}
            <Route element={<VerifyOtpLayout />}>
              <Route path="/verify-otp" element={<VerifyOtp />} />
            </Route>

            {/* ── Auth-Protected: requires a logged-in user ── */}
            <Route element={<ChangePasswordLayout />}>
              <Route path="/change-password" element={<ChangePassword />} />
            </Route>

            {/* ── Fully Protected: requires auth + mounts Socket & Chat ── */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings"  element={<Settings />} />
            </Route>

            {/* ── Default: redirect root to dashboard (ProtectedLayout handles auth) ── */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;