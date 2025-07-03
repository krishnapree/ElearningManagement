import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Floating Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-graduation-cap text-white text-lg"></i>
              </div>
              <span className="text-xl font-bold text-white">EduFlow</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#roles"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Roles
              </a>
              <a
                href="#about"
                className="text-gray-300 hover:text-white transition-colors"
              >
                About
              </a>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-red-500/10 to-purple-600/20"></div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Transform Learning
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                with Smart LMS
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Effortlessly manage learning progress, enhancing engagement and
              student success.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div id="features" className="relative max-w-6xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-graduation-cap text-white text-sm"></i>
                  </div>
                  <span className="text-white font-semibold">EduFlow</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="bg-gray-700/50 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-gray-600/50 focus:outline-none focus:border-orange-500/50 w-64"
                      readOnly
                    />
                    <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  </div>
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">A</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Content with Sidebar */}
              <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-gray-900/50 border-r border-gray-700/50 p-4">
                  <nav className="space-y-2">
                    <div className="flex items-center space-x-3 px-3 py-2 bg-orange-500/20 rounded-lg">
                      <i className="fas fa-chart-line text-orange-400 text-sm"></i>
                      <span className="text-white text-sm font-medium">
                        Dashboard
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-colors">
                      <i className="fas fa-inbox text-sm"></i>
                      <span className="text-sm">Inbox</span>
                      <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                        3
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-colors">
                      <i className="fas fa-book text-sm"></i>
                      <span className="text-sm">Courses</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-colors">
                      <i className="fas fa-question-circle text-sm"></i>
                      <span className="text-sm">Quizzes</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-colors">
                      <i className="fas fa-tasks text-sm"></i>
                      <span className="text-sm">Assignments</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-colors">
                      <i className="fas fa-bullhorn text-sm"></i>
                      <span className="text-sm">Announcements</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-colors">
                      <i className="fas fa-users text-sm"></i>
                      <span className="text-sm">Students</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-colors">
                      <i className="fas fa-dollar-sign text-sm"></i>
                      <span className="text-sm">Earnings</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-colors">
                      <i className="fas fa-certificate text-sm"></i>
                      <span className="text-sm">Certificates</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-colors">
                      <i className="fas fa-chart-bar text-sm"></i>
                      <span className="text-sm">Reports</span>
                    </div>
                  </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">
                          Total Students
                        </span>
                        <span className="text-green-400 text-sm">↗ 12.04%</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        15,799
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">
                          Total Enrolled
                        </span>
                        <span className="text-red-400 text-sm">↘ 4.06%</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        13,290
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">
                          Active Courses
                        </span>
                        <span className="text-green-400 text-sm">↗ 11.07%</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        11,000
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">
                          Completion Rate
                        </span>
                        <span className="text-green-400 text-sm">↗ 16.00%</span>
                      </div>
                      <div className="text-2xl font-bold text-white">89.3%</div>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Learning Progress Chart */}
                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-semibold">
                          Learning Progress
                        </h3>
                        <select className="bg-gray-600/50 text-white text-sm rounded-lg px-3 py-1 border border-gray-500/50">
                          <option>Yearly</option>
                        </select>
                      </div>
                      <div className="h-48 flex items-end justify-between space-x-2">
                        {[40, 60, 30, 80, 50, 90, 70, 85, 45, 75, 95, 65].map(
                          (height, index) => (
                            <div
                              key={index}
                              className="flex-1 bg-gradient-to-t from-orange-500/20 to-orange-500/60 rounded-t"
                              style={{ height: `${height}%` }}
                            ></div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Top Courses */}
                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-semibold">
                          Top Courses
                        </h3>
                        <button className="text-orange-400 text-sm hover:text-orange-300">
                          View all
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                CS
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                Computer Science
                              </div>
                              <div className="text-gray-400 text-sm">
                                342 Students
                              </div>
                            </div>
                          </div>
                          <div className="text-white font-semibold">
                            $3,862.00
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                UX
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                UX Design
                              </div>
                              <div className="text-gray-400 text-sm">
                                298 Students
                              </div>
                            </div>
                          </div>
                          <div className="text-white font-semibold">
                            $3,752.00
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                WF
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                Web Development
                              </div>
                              <div className="text-gray-400 text-sm">
                                256 Students
                              </div>
                            </div>
                          </div>
                          <div className="text-white font-semibold">
                            $1,252.00
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                UI
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                UI Design
                              </div>
                              <div className="text-gray-400 text-sm">
                                198 Students
                              </div>
                            </div>
                          </div>
                          <div className="text-white font-semibold">
                            $1,278.00
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Designed for Every Educational Role
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              EduFlow provides tailored experiences for administrators,
              lecturers, and students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Administrator */}
            <div className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-gray-700/50">
              <div className="absolute top-4 right-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                  <i className="fas fa-shield-alt text-red-400 text-xl"></i>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Administrator
                </h3>
                <p className="text-gray-300">
                  Complete system oversight and management
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-red-400 mr-2 flex-shrink-0"></i>
                  User & Role Management
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-red-400 mr-2 flex-shrink-0"></i>
                  Academic Structure Setup
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-red-400 mr-2 flex-shrink-0"></i>
                  System Analytics & Reports
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-red-400 mr-2 flex-shrink-0"></i>
                  Campus Coordination
                </li>
              </ul>

              <div className="text-center">
                <span className="inline-flex items-center px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm font-medium">
                  <i className="fas fa-users mr-2"></i>
                  System Control
                </span>
              </div>
            </div>

            {/* Lecturer */}
            <div className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-gray-700/50">
              <div className="absolute top-4 right-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <i className="fas fa-book-open text-blue-400 text-xl"></i>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Lecturer</h3>
                <p className="text-gray-300">
                  Course delivery and student assessment
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-blue-400 mr-2 flex-shrink-0"></i>
                  Course Management
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-blue-400 mr-2 flex-shrink-0"></i>
                  Quiz & Assignment Creation
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-blue-400 mr-2 flex-shrink-0"></i>
                  Student Progress Tracking
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-blue-400 mr-2 flex-shrink-0"></i>
                  Grading & Feedback
                </li>
              </ul>

              <div className="text-center">
                <span className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium">
                  <i className="fas fa-bullseye mr-2"></i>
                  Teaching Tools
                </span>
              </div>
            </div>

            {/* Student */}
            <div className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-gray-700/50">
              <div className="absolute top-4 right-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <i className="fas fa-graduation-cap text-green-400 text-xl"></i>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Student</h3>
                <p className="text-gray-300">AI-enhanced learning experience</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-green-400 mr-2 flex-shrink-0"></i>
                  AI Tutoring & Chat
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-green-400 mr-2 flex-shrink-0"></i>
                  Quiz & Assignment Access
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-green-400 mr-2 flex-shrink-0"></i>
                  Grade Tracking
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <i className="fas fa-check-circle text-green-400 mr-2 flex-shrink-0"></i>
                  Course Materials
                </li>
              </ul>

              <div className="text-center">
                <span className="inline-flex items-center px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm font-medium">
                  <i className="fas fa-brain mr-2"></i>
                  AI Learning
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="bg-gradient-to-r from-orange-600 to-red-600 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Education?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Join thousands of educational institutions already using EduFlow
              to enhance learning outcomes with AI-powered education.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-white text-orange-600 font-semibold rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <i className="fas fa-rocket mr-2"></i>
                Start Free Trial
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-orange-600 transition-all duration-200"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
