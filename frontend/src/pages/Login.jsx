import React, { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/axios";
import { useAuth } from "../context/AuthContext.jsx";

/** * Login component provides a user interface for users to authenticate and access their accounts. It includes form fields for email and password, along with validation and error handling. The component integrates with the backend API to perform the login operation and manages authentication state using AuthContext. The design focuses on a modern and visually appealing layout using Tailwind CSS, ensuring a smooth user experience.
 * @returns Login component JSX
 * The component features:
 * - A form with fields for email and password, including icons for better UX.
 * - Validation to ensure required fields are filled and provide feedback on errors.
 * - API integration to submit login credentials and handle responses.
 * - Loading state management to indicate when the login process is in progress.
 * - Navigation to the dashboard upon successful login and handling of unverified accounts.
 * - A visually appealing design with a focus on user experience and accessibility.
 * Note: Ensure that the backend API endpoint `/auth/login` is properly secured and implements necessary security measures such as rate limiting and account lockout policies to protect against brute-force attacks. Additionally, consider implementing multi-factor authentication for enhanced security.
 * The component also includes links for users to navigate to the registration page if they don't have an account and to the change password page for existing users who want to update their credentials. The use of Tailwind CSS allows for a responsive and modern design that enhances the overall user experience. The integration with AuthContext ensures that authentication state is managed effectively across the application, providing a seamless experience for users as they log in and access protected routes.
 * Overall, the Login component serves as a critical entry point for users to access their accounts securely while providing a polished and user-friendly interface. It emphasizes both functionality and aesthetics, making it an essential part of the application's authentication flow.
 */


const Login = () => {
  const navigate    = useNavigate();
  const { login } = useAuth();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await api.post("/auth/login", form);

      // Store access token + user in AuthContext (also clears any leftover verifyToken)
      login(res.data.accessToken, res.data.user);

      navigate("/dashboard");

    } catch (err) {
      if (err.response?.status === 403) {
        setError("Account not verified. Redirecting...");

        const hasVerifyToken = localStorage.getItem("verifyToken");

        setTimeout(() => {
          navigate(hasVerifyToken ? "/verify-otp" : "/register");
        }, 1500);

        return;
      }

      setError(err.response?.data?.message || "Login failed");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0b1f] flex items-center justify-center relative overflow-hidden">

      {/* Background Glow (UI PRESERVED) */}
      <div className="absolute w-150 h-150 bg-purple-600/20 rounded-full blur-[140px] -top-50 -left-37.5" />
      <div className="absolute w-125 h-125 bg-purple-500/10 rounded-full blur-[140px] -bottom-37.5 -right-25" />

      <div className="w-full max-w-md bg-[#151129] border border-purple-500/10 shadow-2xl shadow-purple-900/30 rounded-3xl p-10 relative z-10">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-900/40">
              <svg viewBox="0 0 24 24" className="w-11 h-11" fill="white">
                <path d="M12 3C6.477 3 2 6.94 2 11.5c0 2.63 1.4 4.98 3.6 6.5L4 22l4.3-2.3c1.14.32 2.36.5 3.7.5 5.523 0 10-3.94 10-8.5S17.523 3 12 3z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-purple-300/70 mt-2 text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-purple-400" size={18} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-[#1d1736] text-white placeholder-purple-300/50 border border-purple-500/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-600/30 transition-all rounded-xl py-3 pl-10 pr-4 outline-none"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-purple-400" size={18} />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full bg-[#1d1736] text-white placeholder-purple-300/50 border border-purple-500/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-600/30 transition-all rounded-xl py-3 pl-10 pr-4 outline-none"
            />
          </div>

          <div className="text-right text-sm">
            <Link to="/change-password" className="text-purple-400 hover:text-purple-300 font-medium">
              Change Password?
            </Link>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 active:scale-[0.98] transition-all text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40"
          >
            {loading ? "Signing In..." : "Sign In"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-purple-300/60">
          Don't have an account?{" "}
          <a href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
            Sign up
          </a>
        </div>

      </div>
    </div>
  );
};

export default Login;