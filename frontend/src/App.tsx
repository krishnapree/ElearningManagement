// import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Ask from "./pages/Ask";
import Quiz from "./pages/Quiz";
import Dashboard from "./pages/Dashboard";
import MainDashboard from "./pages/MainDashboard";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Courses from "./pages/Courses";
import StudentEnrollments from "./pages/StudentEnrollments";
import StudentAssignments from "./pages/StudentAssignments";
import StudentGrades from "./pages/StudentGrades";
import StudentAcademicRecords from "./pages/StudentAcademicRecords";
import StudentCourseMaterials from "./pages/StudentCourseMaterials";
import StudentCoursePlaylist from "./pages/StudentCoursePlaylist";
import StudentDiscussions from "./pages/StudentDiscussions";
import StudentAssessments from "./pages/StudentAssessments";
import LecturerCourses from "./pages/LecturerCourses";
import LecturerCourseManagement from "./pages/LecturerCourseManagement";
import LecturerAssessments from "./pages/LecturerAssessments";
import LecturerCourseDetails from "./pages/LecturerCourseDetails";
import LecturerUploadMaterials from "./pages/LecturerUploadMaterials";
import LecturerPrograms from "./pages/LecturerPrograms";
import CourseAnalytics from "./pages/CourseAnalytics";
import StudentManagement from "./pages/StudentManagement";
import DepartmentManagement from "./pages/DepartmentManagement";
import DepartmentDetails from "./pages/DepartmentDetails";
import ProgramManagement from "./pages/ProgramManagement";
import ProgramDetails from "./pages/ProgramDetails";
import UserManagement from "./pages/UserManagement";
import AssignmentManagement from "./pages/AssignmentManagement";
import CourseManagement from "./pages/CourseManagement";
import CampusCoordination from "./pages/CampusCoordination";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import { useAuth } from "./hooks/useAuth";
import CourseDetails from "./pages/CourseDetails";

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Pages that should have full-screen layout without navbar and container
  const fullScreenPages = ["/", "/login", "/register"];
  const isFullScreenPage = fullScreenPages.includes(location.pathname);

  // Apply orange theme to all pages except Home
  const isHomePage = location.pathname === "/";
  const shouldUseOrangeTheme = !isHomePage;

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${shouldUseOrangeTheme ? 'orange-theme' : ''}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isFullScreenPage) {
    return (
      <div className={`min-h-screen ${shouldUseOrangeTheme ? 'orange-theme' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/dashboard" />}
          />
        </Routes>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${shouldUseOrangeTheme ? 'orange-theme' : ''}`}>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/dashboard" />}
          />

          {/* Protected routes */}
          <Route
            path="/ask"
            element={user ? <Ask /> : <Navigate to="/login" />}
          />
          <Route
            path="/quiz"
            element={user ? <Quiz /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard"
            element={user ? <MainDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/analytics"
            element={user ? <Dashboard /> : <Navigate to="/login" />}
          />

          {/* MasterLMS routes */}
          <Route
            path="/courses"
            element={user ? <Courses /> : <Navigate to="/login" />}
          />
          <Route
            path="/enrollments"
            element={user ? <StudentEnrollments /> : <Navigate to="/login" />}
          />
          <Route
            path="/my-assignments"
            element={user ? <StudentAssignments /> : <Navigate to="/login" />}
          />
          <Route
            path="/my-grades"
            element={user ? <StudentGrades /> : <Navigate to="/login" />}
          />
          <Route
            path="/academic-records"
            element={
              user ? <StudentAcademicRecords /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/course-materials"
            element={
              user ? <StudentCourseMaterials /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/course-playlist/:courseId"
            element={
              user ? <StudentCoursePlaylist /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/upload-materials/:courseId"
            element={
              user ? <LecturerUploadMaterials /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/discussions"
            element={user ? <StudentDiscussions /> : <Navigate to="/login" />}
          />
          <Route
            path="/student-assessments"
            element={user ? <StudentAssessments /> : <Navigate to="/login" />}
          />
          <Route
            path="/lecturer-course-management"
            element={
              user ? <LecturerCourseManagement /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/lecturer-assessments"
            element={user ? <LecturerAssessments /> : <Navigate to="/login" />}
          />
          <Route
            path="/my-courses"
            element={user ? <LecturerCourses /> : <Navigate to="/login" />}
          />
          <Route
            path="/my-courses/:courseId"
            element={
              user ? <LecturerCourseDetails /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/students"
            element={user ? <StudentManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/departments"
            element={user ? <DepartmentManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/departments/:departmentId"
            element={user ? <DepartmentDetails /> : <Navigate to="/login" />}
          />
          <Route
            path="/programs"
            element={user ? <ProgramManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/programs/:programId"
            element={user ? <ProgramDetails /> : <Navigate to="/login" />}
          />
          <Route
            path="/user-management"
            element={user ? <UserManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/assignments"
            element={user ? <AssignmentManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/course-management"
            element={user ? <CourseManagement /> : <Navigate to="/login" />}
          />
          <Route
            path="/course-analytics"
            element={user ? <CourseAnalytics /> : <Navigate to="/login" />}
          />
          <Route
            path="/campus-coordination"
            element={user ? <CampusCoordination /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={user ? <UserProfile /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={user ? <Settings /> : <Navigate to="/login" />}
          />
          <Route
            path="/my-programs"
            element={user ? <LecturerPrograms /> : <Navigate to="/login" />}
          />
          <Route
            path="/course-details"
            element={user ? <CourseDetails /> : <Navigate to="/login" />}
          />
          <Route path="/courses/:courseId" element={
            user ? <CourseDetails /> : <Navigate to="/login" />
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
