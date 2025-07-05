// import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Ask from "./pages/Ask";
import Quiz from "./pages/Quiz";
import Dashboard from "./pages/Dashboard";
import MainDashboard from "./pages/MainDashboard";

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
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/register" element={<Navigate to="/" />} />
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
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/register" element={<Navigate to="/" />} />

          {/* All routes are now accessible without authentication */}
          <Route path="/ask" element={<Ask />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/dashboard" element={<MainDashboard />} />
          <Route path="/analytics" element={<Dashboard />} />

          {/* MasterLMS routes */}
          <Route path="/courses" element={<Courses />} />
          <Route path="/enrollments" element={<StudentEnrollments />} />
          <Route path="/my-assignments" element={<StudentAssignments />} />
          <Route path="/my-grades" element={<StudentGrades />} />
          <Route path="/academic-records" element={<StudentAcademicRecords />} />
          <Route path="/course-materials" element={<StudentCourseMaterials />} />
          <Route path="/course-playlist/:courseId" element={<StudentCoursePlaylist />} />
          <Route path="/upload-materials/:courseId" element={<LecturerUploadMaterials />} />
          <Route path="/discussions" element={<StudentDiscussions />} />
          <Route path="/student-assessments" element={<StudentAssessments />} />
          <Route path="/lecturer-course-management" element={<LecturerCourseManagement />} />
          <Route path="/lecturer-assessments" element={<LecturerAssessments />} />
          <Route path="/my-courses" element={<LecturerCourses />} />
          <Route path="/my-courses/:courseId" element={<LecturerCourseDetails />} />
          <Route path="/students" element={<StudentManagement />} />
          <Route path="/departments" element={<DepartmentManagement />} />
          <Route path="/departments/:departmentId" element={<DepartmentDetails />} />
          <Route path="/programs" element={<ProgramManagement />} />
          <Route path="/programs/:programId" element={<ProgramDetails />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/assignments" element={<AssignmentManagement />} />
          <Route path="/course-management" element={<CourseManagement />} />
          <Route path="/course-analytics" element={<CourseAnalytics />} />
          <Route path="/campus-coordination" element={<CampusCoordination />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/my-programs" element={<LecturerPrograms />} />
          <Route path="/course-details" element={<CourseDetails />} />
          <Route path="/courses/:courseId" element={<CourseDetails />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
