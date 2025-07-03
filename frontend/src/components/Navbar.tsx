import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";

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
    // This will be updated when we integrate with the backend user role
    return user?.role || "student"; // Default to student for now
  };

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
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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
                            <i className="fas fa-user-graduate mr-2"></i>
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
                            <i className="fas fa-folder-open mr-2"></i>
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
                            <i className="fas fa-clipboard-list mr-2"></i>
                            Assessments
                          </Link>
                        </>
                      )}
                      {getUserRole() === "lecturer" && (
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
                            to="/my-courses"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-chalkboard-teacher mr-2"></i>
                            My Courses
                          </Link>
                          <Link
                            to="/my-programs"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-graduation-cap mr-2"></i>
                            My Programs
                          </Link>
                          <Link
                            to="/lecturer-course-management"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-upload mr-2"></i>
                            Course Management
                          </Link>
                          <Link
                            to="/lecturer-assessments"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-clipboard-list mr-2"></i>
                            Assessments
                          </Link>
                          <Link
                            to="/students"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-users mr-2"></i>
                            Students
                          </Link>
                        </>
                      )}
                      {getUserRole() === "admin" && (
                        <>
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
                            <i className="fas fa-book-open mr-2"></i>
                            Course Management
                          </Link>
                          <Link
                            to="/user-management"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-users-cog mr-2"></i>
                            User Management
                          </Link>
                          <Link
                            to="/campus-coordination"
                            className={getDropdownLinkClass()}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <i className="fas fa-bullhorn mr-2"></i>
                            Campus Coordination
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Dashboard */}
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
              </>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => toggleDropdown("user")}
                  className={`flex items-center space-x-2 text-gray-700 transition-colors focus:outline-none ${
                    shouldUseOrangeTheme ? 'hover:text-orange-600' : 'hover:text-primary-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    shouldUseOrangeTheme ? 'bg-orange-100' : 'bg-primary-100'
                  }`}>
                    <span className={`font-medium text-sm ${
                      shouldUseOrangeTheme ? 'text-orange-600' : 'text-primary-600'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block font-medium">
                    {user.name}
                  </span>
                  <i
                    className={`fas fa-chevron-down text-xs transition-transform ${
                      activeDropdown === "user" ? "rotate-180" : ""
                    }`}
                  ></i>
                </button>

                {activeDropdown === "user" && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className={`text-xs capitalize ${
                        shouldUseOrangeTheme ? 'text-orange-600' : 'text-primary-600'
                      }`}>
                        {user.role}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(
                          "User Profile clicked - using window.location"
                        );
                        setActiveDropdown(null);
                        window.location.href = "/profile";
                      }}
                      className={`flex items-center w-full px-4 py-2 text-gray-700 transition-colors text-left ${
                        shouldUseOrangeTheme
                          ? 'hover:bg-orange-50 hover:text-orange-600'
                          : 'hover:bg-primary-50 hover:text-primary-600'
                      }`}
                    >
                      <i className="fas fa-user mr-3"></i>
                      User Profile
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Settings clicked - using window.location");
                        setActiveDropdown(null);
                        window.location.href = "/settings";
                      }}
                      className={`flex items-center w-full px-4 py-2 text-gray-700 transition-colors text-left ${
                        shouldUseOrangeTheme
                          ? 'hover:bg-orange-50 hover:text-orange-600'
                          : 'hover:bg-primary-50 hover:text-primary-600'
                      }`}
                    >
                      <i className="fas fa-cog mr-3"></i>
                      Settings
                    </button>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("Logout clicked");
                          setActiveDropdown(null);
                          handleLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <i className="fas fa-sign-out-alt mr-3"></i>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="btn btn-outline btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-800"
              title="Open mobile menu"
              aria-label="Open mobile menu"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
