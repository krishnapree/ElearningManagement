import React from "react";
import { useAuth } from "../hooks/useAuth";
import AdminDashboard from "./AdminDashboard";
import StudentDashboard from "./StudentDashboard";
import LecturerDashboard from "./LecturerDashboard";
import Dashboard from "./Dashboard"; // Fallback to original analytics dashboard

const MainDashboard: React.FC = () => {
  const { user } = useAuth();

  // Get user role from backend user data
  const userRole = user?.role || "student";

  // Render role-specific dashboard
  switch (userRole) {
    case "admin":
      return <AdminDashboard />;
    case "lecturer":
      return <LecturerDashboard />;
    case "student":
      return <StudentDashboard />;
    default:
      // Fallback to original analytics dashboard for unknown roles
      return <Dashboard />;
  }
};

export default MainDashboard;
