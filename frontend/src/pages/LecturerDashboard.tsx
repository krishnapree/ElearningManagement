import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

interface LecturerDashboard {
  current_semester: {
    id: number;
    name: string;
    year: number;
  };
  courses: Array<{
    id: number;
    name: string;
    code: string;
    credits: number;
    department: string;
    max_capacity: number;
    enrolled_count: number;
    available_spots: number;
  }>;
  pending_submissions: Array<{
    id: number;
    assignment: string;
    student: string;
    course: string;
    submitted_at: string;
    is_late: boolean;
    days_since_submission: number;
  }>;
  course_statistics: {
    total_courses: number;
    total_students: number;
    total_assignments: number;
    average_class_size: number;
  };
}

const LecturerDashboard: React.FC = () => {
  const { user: _user } = useAuth();
  const [dashboardData, setDashboardData] = useState<LecturerDashboard | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard?role=lecturer");
      if (response.ok) {
        let data = null;
        try {
          data = await response.json();
        } catch (e) {
          console.error("Invalid JSON response", e);
        }
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEnrollmentPercentage = (enrolled: number, capacity: number) => {
    return Math.round((enrolled / capacity) * 100);
  };

  const getEnrollmentColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load dashboard data</p>
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
            Lecturer Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {_user?.name}. {dashboardData.current_semester.name}{" "}
            semester overview.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chalkboard-teacher text-blue-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">My Courses</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.course_statistics.total_courses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-green-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Students
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.course_statistics.total_students}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-tasks text-purple-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Assignments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.course_statistics.total_assignments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-orange-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Avg Class Size
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(
                    dashboardData.course_statistics.average_class_size
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    My Courses
                  </h2>
                  <Link
                    to="/my-courses"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Manage All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.courses.map((course) => {
                    const enrollmentPercentage = getEnrollmentPercentage(
                      course.enrolled_count,
                      course.max_capacity
                    );
                    return (
                      <div
                        key={course.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {course.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {course.code} • {course.department} •{" "}
                              {course.credits} credits
                            </p>

                            {/* Enrollment Progress */}
                            <div className="mt-3">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Enrollment</span>
                                <span>
                                  {course.enrolled_count}/{course.max_capacity}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${getEnrollmentColor(
                                    enrollmentPercentage
                                  )}`}
                                  style={{ width: `${enrollmentPercentage}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {course.available_spots} spots available
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <i className="fas fa-users"></i>
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <i className="fas fa-chart-bar"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Submissions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pending Grading
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.pending_submissions
                    .slice(0, 5)
                    .map((submission) => (
                      <div
                        key={submission.id}
                        className="border-l-4 border-yellow-500 pl-4"
                      >
                        <h3 className="font-medium text-gray-900">
                          {submission.assignment}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {submission.student}
                        </p>
                        <p className="text-sm text-gray-500">
                          {submission.course}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {submission.days_since_submission} days ago
                          </span>
                          {submission.is_late && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Late
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  {dashboardData.pending_submissions.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No pending submissions
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Link
                    to="/lecturer-assessments"
                    className="w-full flex items-center p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <i className="fas fa-plus text-primary-600 mr-3"></i>
                    <span className="font-medium text-primary-700">
                      Create Assignment
                    </span>
                  </Link>

                  <Link
                    to="/lecturer-course-management"
                    className="w-full flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <i className="fas fa-upload text-blue-600 mr-3"></i>
                    <span className="font-medium text-blue-700">
                      Upload Materials
                    </span>
                  </Link>

                  <Link
                    to="/my-courses"
                    className="w-full flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <i className="fas fa-users text-green-600 mr-3"></i>
                    <span className="font-medium text-green-700">
                      View Students
                    </span>
                  </Link>

                  <Link
                    to="/course-analytics"
                    className="w-full flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <i className="fas fa-chart-bar text-purple-600 mr-3"></i>
                    <span className="font-medium text-purple-700">
                      Course Analytics
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
