import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";
import RoleSwitcher from "./RoleSwitcher";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const learningDropdownRef = useRef<HTMLDivElement>(null);
  const academicDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    console.log("handleLogout called");
    try {
      await logout();
      console.log("Logout successful, navigating to home");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSwitchRole = () => {
    // Clear the current user and navigate to home to select a new role
    localStorage.removeItem('selectedUser');
    navigate("/");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isDropdownActive = (paths: string[]) => {
    return paths.some((path) => location.pathname.startsWith(path));
  };

  // Check if we should use orange theme (all pages except home)
  const isHomePage = location.pathname === "/";
  const shouldUseOrangeTheme = !isHomePage;

  // Helper function for dropdown link classes
  const getDropdownLinkClass = () => {
    return `block px-4 py-2 text-gray-700 transition-colors ${
      shouldUseOrangeTheme
        ? 'hover:bg-orange-50 hover:text-orange-600'
        : 'hover:bg-primary-50 hover:text-primary-600'
    }`;
  };

  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        activeDropdown === "user" &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target)
      ) {
        setActiveDropdown(null);
      } else if (
        activeDropdown === "learning" &&
        learningDropdownRef.current &&
        !learningDropdownRef.current.contains(target)
      ) {
        setActiveDropdown(null);
      } else if (
        activeDropdown === "academic" &&
        academicDropdownRef.current &&
        !academicDropdownRef.current.contains(target)
      ) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  // Get user role for conditional navigation
  const getUserRole = () => {
    return user?.role || "student";
  };

  // Get role color and icon
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: 'fas fa-shield-alt' };
      case 'lecturer':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: 'fas fa-chalkboard-teacher' };
      case 'student':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: 'fas fa-user-graduate' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: 'fas fa-user' };
    }
  };

  const roleInfo = getRoleInfo(getUserRole());

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              shouldUseOrangeTheme ? 'bg-orange-600' : 'bg-primary-600'
            }`}>
              <i className="fas fa-graduation-cap text-white text-lg"></i>
            </div>
            <span className="text-xl font-bold text-gray-800">EduFlow</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`text-gray-600 transition-colors ${
                shouldUseOrangeTheme
                  ? `hover:text-orange-600 ${isActive("/") ? "text-orange-600 font-medium" : ""}`
                  : `hover:text-primary-600 ${isActive("/") ? "text-primary-600 font-medium" : ""}`
              }`}
            >
              Home
            </Link>

            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-gray-600 transition-colors ${
                    shouldUseOrangeTheme
                      ? `hover:text-orange-600 ${isActive("/dashboard") ? "text-orange-600 font-medium" : ""}`
                      : `hover:text-primary-600 ${isActive("/dashboard") ? "text-primary-600 font-medium" : ""}`
                  }`}
                >
                  Dashboard
                </Link>
                {/* AI Learning Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown("learning")}
                    className={`flex items-center text-gray-600 transition-colors ${
                      shouldUseOrangeTheme
                        ? `hover:text-orange-600 ${isDropdownActive(["/ask"]) ? "text-orange-600 font-medium" : ""}`
                        : `hover:text-primary-600 ${isDropdownActive(["/ask"]) ? "text-primary-600 font-medium" : ""}`
                    }`}
                  >
                    AI Learning
                    <i
                      className={`fas fa-chevron-down ml-1 text-xs transition-transform ${
                        activeDropdown === "learning" ? "rotate-180" : ""
                      }`}
                    ></i>
                  </button>

                  {activeDropdown === "learning" && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        to="/ask"
                        className={getDropdownLinkClass()}
                        onClick={() => setActiveDropdown(null)}
                      >
                        <i className="fas fa-robot mr-2"></i>
                        Ask AI
                      </Link>
                    </div>
                  )}
                </div>

                {/* Academic Dropdown - Role-based */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown("academic")}
                    className={`flex items-center text-gray-600 transition-colors ${
                      shouldUseOrangeTheme
                        ? `hover:text-orange-600 ${isDropdownActive([
                            "/courses",
                            "/enrollments",
                            "/my-assignments",
                            "/my-grades",
                            "/academic-records",
                            "/course-materials",
                            "/discussions",
                            "/student-assessments",
                            "/my-courses",
                            "/lecturer-course-management",
                            "/lecturer-assessments",
                            "/students",
                            "/departments",
                            "/programs",
                            "/course-management",
                            "/user-management",
                            "/campus-coordination",
                            "/assignments",
                            "/academic",
                          ]) ? "text-orange-600 font-medium" : ""}`
                        : `hover:text-primary-600 ${isDropdownActive([
                            "/courses",
                            "/enrollments",
                            "/my-assignments",
                            "/my-grades",
                            "/academic-records",
                            "/course-materials",
                            "/discussions",
                            "/student-assessments",
                            "/my-courses",
                            "/lecturer-course-management",
                            "/lecturer-assessments",
                            "/students",
                            "/departments",
                            "/programs",
                            "/course-management",
                            "/user-management",
                            "/campus-coordination",
                            "/assignments",
                            "/academic",
                          ]) ? "text-primary-600 font-medium" : ""}`
                    }`}
                  >
                    Academic
                    <i
                      className={`fas fa-chevron-down ml-1 text-xs transition-transform ${
                        activeDropdown === "academic" ? "rotate-180" : ""
                      }`}
                    ></i>
                  </button>

                  {activeDropdown === "academic" && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* Student-specific links */}
                      {getUserRole() === "student" && (
                        <>
                          <Link
                            to="/courses"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-book mr-2"></i>
                            Browse Courses
                          </Link>
                          <Link
                            to="/enrollments"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-user-plus mr-2"></i>
                            My Enrollments
                          </Link>
                          <Link
                            to="/my-assignments"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-tasks mr-2"></i>
                            My Assignments
                          </Link>
                          <Link
                            to="/my-grades"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-chart-line mr-2"></i>
                            My Grades
                          </Link>
                          <Link
                            to="/academic-records"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-file-alt mr-2"></i>
                            Academic Records
                          </Link>
                          <Link
                            to="/course-materials"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-download mr-2"></i>
                            Course Materials
                          </Link>
                          <Link
                            to="/discussions"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-comments mr-2"></i>
                            Discussions
                          </Link>
                          <Link
                            to="/student-assessments"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-question-circle mr-2"></i>
                            Assessments
                          </Link>
                        </>
                      )}

                      {/* Lecturer-specific links */}
                      {getUserRole() === "lecturer" && (
                        <>
                          <Link
                            to="/my-courses"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-book mr-2"></i>
                            My Courses
                          </Link>
                          <Link
                            to="/lecturer-course-management"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-cogs mr-2"></i>
                            Course Management
                          </Link>
                          <Link
                            to="/lecturer-assessments"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-question-circle mr-2"></i>
                            Assessments
                          </Link>
                          <Link
                            to="/students"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-users mr-2"></i>
                            My Students
                          </Link>
                          <Link
                            to="/my-programs"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-graduation-cap mr-2"></i>
                            My Programs
                          </Link>
                        </>
                      )}

                      {/* Admin-specific links */}
                      {getUserRole() === "admin" && (
                        <>
                          <Link
                            to="/user-management"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-users mr-2"></i>
                            User Management
                          </Link>
                          <Link
                            to="/departments"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-building mr-2"></i>
                            Departments
                          </Link>
                          <Link
                            to="/programs"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-graduation-cap mr-2"></i>
                            Programs
                          </Link>
                          <Link
                            to="/course-management"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-book mr-2"></i>
                            Course Management
                          </Link>
                          <Link
                            to="/assignments"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-tasks mr-2"></i>
                            Assignments
                          </Link>
                          <Link
                            to="/course-analytics"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-chart-bar mr-2"></i>
                            Analytics
                          </Link>
                          <Link
                            to="/campus-coordination"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-map-marker-alt mr-2"></i>
                            Campus Coordination
                          </Link>
                        </>
                      )}

                      {/* Common links for all roles */}
                      <div className="border-t border-gray-200 my-2"></div>
                      <Link
                        to="/courses"
                        className={getDropdownLinkClass()}
                        onClick={() => setActiveDropdown(null)}
                      >
                        <i className="fas fa-search mr-2"></i>
                        All Courses
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <RoleSwitcher />
            )}
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => toggleDropdown("user")}
                  className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {/* Role indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${roleInfo.bgColor}`}>
                    <i className={`${roleInfo.icon} ${roleInfo.color} text-sm`}></i>
                  </div>
                  
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                  </div>
                  
                  <i
                    className={`fas fa-chevron-down text-xs transition-transform ${
                      activeDropdown === "user" ? "rotate-180" : ""
                    }`}
                  ></i>
                </button>

                {activeDropdown === "user" && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                    </div>
                    
                    <Link
                      to="/profile"
                      className={getDropdownLinkClass()}
                      onClick={() => setActiveDropdown(null)}
                    >
                      <i className="fas fa-user mr-2"></i>
                      Profile
                    </Link>
                    
                    <Link
                      to="/settings"
                      className={getDropdownLinkClass()}
                      onClick={() => setActiveDropdown(null)}
                    >
                      <i className="fas fa-cog mr-2"></i>
                      Settings
                    </Link>
                    
                    <button
                      onClick={handleSwitchRole}
                      className={`w-full text-left ${getDropdownLinkClass()}`}
                    >
                      <i className="fas fa-exchange-alt mr-2"></i>
                      Switch Role
                    </button>
                    
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    <button
                      onClick={handleLogout}
                      className={`w-full text-left ${getDropdownLinkClass()} text-red-600 hover:text-red-700`}
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/"
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  shouldUseOrangeTheme
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
