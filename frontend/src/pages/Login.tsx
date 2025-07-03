import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-red-500/10 to-purple-600/20"></div>
        <div className="absolute inset-0 opacity-30">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl mb-4">
              <i className="fas fa-graduation-cap text-white text-3xl"></i>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">EduFlow</h1>
            <p className="text-orange-200 text-lg">
              AI-Powered Learning Management
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6 max-w-md">
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <i className="fas fa-brain text-orange-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  AI-Powered Tutoring
                </h3>
                <p className="text-gray-300 text-sm">
                  Get personalized learning assistance
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <i className="fas fa-chart-line text-orange-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-white font-semibold">Progress Tracking</h3>
                <p className="text-gray-300 text-sm">
                  Monitor your learning journey
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <i className="fas fa-users text-orange-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  Collaborative Learning
                </h3>
                <p className="text-gray-300 text-sm">
                  Connect with peers and instructors
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-white">15K+</div>
              <div className="text-orange-200 text-sm">Students</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-orange-200 text-sm">Courses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">98%</div>
              <div className="text-orange-200 text-sm">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="lg:hidden mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl mb-4">
                <i className="fas fa-graduation-cap text-white text-2xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">EduFlow</h1>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome Back!
            </h2>
            <p className="text-gray-400">
              Sign in to continue your learning journey
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle text-red-400 mr-3"></i>
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your email address"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-orange-400 hover:text-orange-300 transition-colors text-lg"
                >
                  <span className="text-xl">{showPassword ? "🙈" : "👁️"}</span>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500/50 border-white/20 rounded bg-white/5 backdrop-blur-sm"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-3 block text-sm text-gray-300"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Sign In
                </div>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 backdrop-blur-sm"
              >
                <i className="fab fa-google mr-2"></i>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 backdrop-blur-sm"
              >
                <i className="fab fa-microsoft mr-2"></i>
                Microsoft
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>

          {/* Mobile Features Preview */}
          <div className="lg:hidden mt-8">
            <p className="text-sm text-gray-400 mb-4 text-center">
              Start learning with AI-powered features:
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <i className="fas fa-brain text-orange-400 text-lg mb-2 block"></i>
                <p className="text-xs text-gray-300">AI Tutoring</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <i className="fas fa-chart-line text-orange-400 text-lg mb-2 block"></i>
                <p className="text-xs text-gray-300">Progress Tracking</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <i className="fas fa-users text-orange-400 text-lg mb-2 block"></i>
                <p className="text-xs text-gray-300">Collaboration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
