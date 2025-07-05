import React from "react";
import { Link } from "react-router-dom";

// Predefined user data for each role
const PREDEFINED_USERS = {
  admin: {
    id: 1,
    name: "System Administrator",
    email: "admin@lms.edu",
    role: "admin",
    subscription_status: "premium"
  },
  lecturer: {
    id: 2,
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@lms.edu",
    role: "lecturer",
    subscription_status: "premium"
  },
  student: {
    id: 3,
    name: "Alice Smith",
    email: "alice.smith@student.lms.edu",
    role: "student",
    subscription_status: "free"
  }
};

const Home: React.FC = () => {
  const handleRoleSelect = (role: 'admin' | 'lecturer' | 'student') => {
    localStorage.removeItem('selectedUser'); // Clear any previous user
    localStorage.setItem('selectedUser', JSON.stringify(PREDEFINED_USERS[role]));
    window.location.href = '/dashboard'; // Force full reload and navigation
  };

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

            {/* Role Selection Section */}
            <div id="roles" className="mt-16">
              <h2 className="text-3xl font-bold text-white mb-8">
                Choose Your Role
              </h2>
              <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
                Experience the platform from different perspectives. Select a role to explore the features available to each user type.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {/* Admin Role */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-shield-alt text-white text-2xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Administrator</h3>
                  <p className="text-gray-300 mb-6">
                    Full system access with user management, academic oversight, and comprehensive analytics.
                  </p>
                  <ul className="text-gray-300 text-sm mb-8 space-y-2">
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      User Management
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      Department & Program Management
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      System Analytics
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      Campus Coordination
                    </li>
                  </ul>
                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                  >
                    Access as Admin
                  </button>
                </div>

                {/* Lecturer Role */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-chalkboard-teacher text-white text-2xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Lecturer</h3>
                  <p className="text-gray-300 mb-6">
                    Course management, student assessment, and academic content creation tools.
                  </p>
                  <ul className="text-gray-300 text-sm mb-8 space-y-2">
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      Course Management
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      Student Assessment
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      Material Upload
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      Grade Management
                    </li>
                  </ul>
                  <button
                    onClick={() => handleRoleSelect('lecturer')}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                  >
                    Access as Lecturer
                  </button>
                </div>

                {/* Student Role */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-user-graduate text-white text-2xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Student</h3>
                  <p className="text-gray-300 mb-6">
                    Course enrollment, assignment submission, and progress tracking features.
                  </p>
                  <ul className="text-gray-300 text-sm mb-8 space-y-2">
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      Course Enrollment
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      Assignment Submission
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      Progress Tracking
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-400 mr-2"></i>
                      Grade Viewing
                    </li>
                  </ul>
                  <button
                    onClick={() => handleRoleSelect('student')}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                  >
                    Access as Student
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div id="features" className="relative max-w-6xl mx-auto mt-20">
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

                {/* Main Content Area */}
                <div className="flex-1 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Stats Cards */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Total Students</p>
                          <p className="text-2xl font-bold">1,234</p>
                        </div>
                        <i className="fas fa-users text-2xl opacity-80"></i>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">Active Courses</p>
                          <p className="text-2xl font-bold">56</p>
                        </div>
                        <i className="fas fa-book text-2xl opacity-80"></i>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm">Assignments</p>
                          <p className="text-2xl font-bold">89</p>
                        </div>
                        <i className="fas fa-tasks text-2xl opacity-80"></i>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm">Completion Rate</p>
                          <p className="text-2xl font-bold">94%</p>
                        </div>
                        <i className="fas fa-chart-line text-2xl opacity-80"></i>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="mt-8 bg-gray-800/30 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-user-plus text-white text-sm"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">New student enrolled in Computer Science</p>
                          <p className="text-gray-400 text-xs">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-upload text-white text-sm"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">Course materials uploaded for Mathematics 101</p>
                          <p className="text-gray-400 text-xs">4 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-white text-sm"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">Assignment graded for Physics Lab</p>
                          <p className="text-gray-400 text-xs">6 hours ago</p>
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

      {/* Features Section */}
      <section id="about" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features for Every Role
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our comprehensive LMS platform provides tailored experiences for administrators, lecturers, and students.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-shield-alt text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Administrative Control</h3>
              <p className="text-gray-300">
                Complete system oversight with user management, academic planning, and comprehensive analytics.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-chalkboard-teacher text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Teaching Excellence</h3>
              <p className="text-gray-300">
                Advanced tools for course creation, student assessment, and content management.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-user-graduate text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Student Success</h3>
              <p className="text-gray-300">
                Intuitive learning experience with progress tracking, assignment submission, and grade monitoring.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
