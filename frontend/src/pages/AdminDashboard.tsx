import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
// import { apiClient } from "../api/client";

interface AcademicOverview {
  total_students: number;
  total_lecturers: number;
  total_courses: number;
  total_departments: number;
  total_programs: number;
  current_semester: string;
  current_enrollments: number;
  system_status: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  student_id?: string;
  employee_id?: string;
  is_active: boolean;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AcademicOverview | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch academic overview
      const overviewResponse = await fetch("/api/academic/overview", {
        credentials: "include",
      });
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setOverview(overviewData);
      } else {
        console.error("Failed to fetch academic overview:", overviewResponse.status);
      }

      // Fetch recent users (students)
      const usersResponse = await fetch("/api/users/by-role/student", {
        credentials: "include",
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setRecentUsers(usersData.users?.slice(0, 5) || []); // Show latest 5
      } else {
        console.error("Failed to fetch users:", usersResponse.status);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.name}. Here's your system overview.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                {
                  id: "overview",
                  name: "System Overview",
                  icon: "fa-chart-line",
                },
                { id: "users", name: "User Management", icon: "fa-users" },
                {
                  id: "academic",
                  name: "Academic Structure",
                  icon: "fa-graduation-cap",
                },
                { id: "analytics", name: "Analytics", icon: "fa-analytics" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <i className={`fas ${tab.icon} mr-2`}></i>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && overview && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-user-graduate text-blue-600"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Total Students
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {overview.total_students || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-chalkboard-teacher text-green-600"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Total Lecturers
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {overview.total_lecturers || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-book text-purple-600"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Active Courses
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {overview.total_courses || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-users text-orange-600"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Current Enrollments
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {overview.current_enrollments || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-building text-indigo-600"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Departments
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {overview.total_departments || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-graduation-cap text-pink-600"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Programs
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {overview.total_programs || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-calendar text-teal-600"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Current Semester
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {overview.current_semester || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    System Status
                  </h3>
                  <p className="text-gray-600">
                    Current system status and health information
                  </p>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    overview.system_status === "operational" ? "bg-green-500" : "bg-red-500"
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {overview.system_status || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Students
              </h2>
            </div>
            <div className="p-6">
              {recentUsers.length > 0 ? (
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.student_id && (
                          <p className="text-xs text-gray-400">ID: {user.student_id}</p>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent students found</p>
              )}
            </div>
          </div>
        )}

        {/* Academic Structure Tab */}
        {activeTab === "academic" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Departments</h3>
                  <i className="fas fa-building text-blue-600"></i>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {overview?.total_departments || 0}
                </p>
                <p className="text-sm text-gray-500">Active departments</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Programs</h3>
                  <i className="fas fa-graduation-cap text-green-600"></i>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {overview?.total_programs || 0}
                </p>
                <p className="text-sm text-gray-500">Active programs</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Courses</h3>
                  <i className="fas fa-book text-purple-600"></i>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {overview?.total_courses || 0}
                </p>
                <p className="text-sm text-gray-500">Active courses</p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h3>
            <p className="text-gray-500">Analytics features coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
