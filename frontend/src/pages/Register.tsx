import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register(formData.name, formData.email, formData.password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
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

          {/* Benefits */}
          <div className="space-y-6 max-w-md">
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <i className="fas fa-user-plus text-orange-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-white font-semibold">Join 15K+ Students</h3>
                <p className="text-gray-300 text-sm">
                  Be part of our growing community
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <i className="fas fa-brain text-orange-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  AI-Powered Learning
                </h3>
                <p className="text-gray-300 text-sm">
                  Personalized tutoring experience
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <i className="fas fa-certificate text-orange-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-white font-semibold">Earn Certificates</h3>
                <p className="text-gray-300 text-sm">
                  Get recognized for your achievements
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-semibold text-sm">JS</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">
                  John Smith
                </div>
                <div className="text-orange-200 text-xs">
                  Computer Science Student
                </div>
              </div>
            </div>
            <p className="text-gray-300 text-sm italic">
              "EduFlow's AI tutoring helped me understand complex concepts
              faster than ever before!"
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
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
              Create Account
            </h2>
            <p className="text-gray-400">
              Join thousands of learners using EduFlow
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

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your full name"
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
            </div>

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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="Create a password (min. 6 characters)"
                  disabled={loading}
                  autoComplete="new-password"
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

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="Confirm your password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-orange-400 hover:text-orange-300 transition-colors text-lg"
                >
                  <span className="text-xl">
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </span>
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500/50 border-white/20 rounded bg-white/5 backdrop-blur-sm"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-300">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="fas fa-user-plus mr-2"></i>
                  Create Account
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
                  Or sign up with
                </span>
              </div>
            </div>

            {/* Social Sign Up Buttons */}
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

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Mobile Benefits */}
          <div className="lg:hidden mt-8">
            <h3 className="text-center text-sm font-medium text-gray-300 mb-4">
              What you'll get with EduFlow:
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-300 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <i className="fas fa-check text-orange-400 mr-3"></i>
                Personalized AI-powered explanations
              </div>
              <div className="flex items-center text-sm text-gray-300 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <i className="fas fa-check text-orange-400 mr-3"></i>
                Adaptive quizzes based on your learning
              </div>
              <div className="flex items-center text-sm text-gray-300 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <i className="fas fa-check text-orange-400 mr-3"></i>
                Voice input and hands-free learning
              </div>
              <div className="flex items-center text-sm text-gray-300 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <i className="fas fa-check text-orange-400 mr-3"></i>
                Detailed progress tracking and analytics
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
