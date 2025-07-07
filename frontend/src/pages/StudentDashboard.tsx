import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import { apiClient } from '../api/client';

interface StudentDashboard {
  current_semester: {
    id: number;
    name: string;
    year: number;
  };
  enrollments: Array<{
    id: number;
    course: {
      id: number;
      name: string;
      code: string;
      credits: number;
      lecturer: string;
    };
    status: string;
    final_grade?: string;
    attendance_percentage?: number;
  }>;
  upcoming_assignments: Array<{
    id: number;
    title: string;
    course: string;
    course_code: string;
    due_date: string;
    max_points: number;
    days_until_due: number;
    type?: string;
    difficulty?: string;
  }>;
  academic_progress: {
    gpa?: number;
    total_credits: number;
    credits_earned: number;
    completion_percentage: number;
  };
  total_courses: number;
  completed_assignments: number;
  recent_grades?: Array<{
    assignment_title: string;
    course_name: string;
    grade: number;
    max_points: number;
    percentage: number;
    graded_date: string;
    type: string;
  }>;
  course_progress?: Array<{
    course_name: string;
    progress: number;
    current_module: string;
    modules_completed: number;
    total_modules: number;
  }>;
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
    timestamp: string;
    read: boolean;
  }>;
  achievements?: Array<{
    id: number;
    title: string;
    description: string;
    icon: string;
    earned_date: string;
    category: string;
  }>;
  study_schedule?: Array<{
    day: string;
    time: string;
    activity: string;
    location: string;
    type: string;
  }>;
  quick_stats?: {
    assignments_this_week: number;
    quizzes_this_week: number;
    study_hours_this_week: number;
    attendance_rate: number;
    current_streak: {
      type: string;
      count: number;
      description: string;
    };
    next_deadline: {
      title: string;
      course: string;
      hours_remaining: number;
    };
  };
}

const StudentDashboard: React.FC = () => {
  const { user: _user } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentDashboard | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data for user:', _user?.id);
      const data = await apiClient.request<StudentDashboard>(`/dashboard?role=student&t=${Date.now()}`, {
        credentials: "include",
        cache: "no-cache",
      });
      console.log('Dashboard data received:', data);
      console.log('Setting dashboard data at:', new Date().toISOString());
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade?: string) => {
    if (!grade) return "text-gray-500";
    const gradeValue = parseFloat(grade);
    if (gradeValue >= 90) return "text-green-600";
    if (gradeValue >= 80) return "text-blue-600";
    if (gradeValue >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getUrgencyColor = (daysUntilDue: number) => {
    if (daysUntilDue <= 1) return "bg-red-100 text-red-800";
    if (daysUntilDue <= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
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
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Ensure we have the required data structures
  const currentSemester = dashboardData.current_semester || { name: "Current Semester", id: 1, year: new Date().getFullYear() };
  const enrollments = dashboardData.enrollments || [];
  const upcomingAssignments = dashboardData.upcoming_assignments || [];
  const academicProgress = dashboardData.academic_progress || { gpa: null, total_credits: 0, credits_earned: 0, completion_percentage: 0 };
  const totalCourses = dashboardData.total_courses || 0;
  const completedAssignments = dashboardData.completed_assignments || 0;
  const recentGrades = dashboardData.recent_grades || [];
  const courseProgress = dashboardData.course_progress || [];
  const notifications = dashboardData.notifications || [];
  const achievements = dashboardData.achievements || [];
  const studySchedule = dashboardData.study_schedule || [];
  const quickStats = dashboardData.quick_stats || null;

  // Debug logging
  console.log('Dashboard render data:', {
    dashboardData,
    academicProgress,
    enrollments: enrollments.length,
    upcomingAssignments: upcomingAssignments.length,
    totalCourses,
    completedAssignments
  });

  // Temporary debug display
  const showDebugInfo = true;

  return (
    <div key={`dashboard-${Date.now()}`} className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {_user?.name}!
              </h1>
              <p className="text-gray-600">
                {currentSemester.name} •{" "}
                {totalCourses} courses enrolled
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Debug Info */}
        {showDebugInfo && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Info</h3>
            <div className="text-sm text-yellow-700 grid grid-cols-2 gap-4">
              <div>
                <p><strong>Basic Data:</strong></p>
                <p>GPA: {academicProgress.gpa}</p>
                <p>Credits Earned: {academicProgress.credits_earned}</p>
                <p>Total Courses: {totalCourses}</p>
                <p>Completed Assignments: {completedAssignments}</p>
                <p>Enrollments: {enrollments.length}</p>
                <p>Upcoming Assignments: {upcomingAssignments.length}</p>
              </div>
              <div>
                <p><strong>Extended Data:</strong></p>
                <p>Recent Grades: {recentGrades.length}</p>
                <p>Course Progress: {courseProgress.length}</p>
                <p>Notifications: {notifications.length}</p>
                <p>Achievements: {achievements.length}</p>
                <p>Study Schedule: {studySchedule.length}</p>
                <p>Quick Stats: {quickStats ? 'Available' : 'Missing'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-blue-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current GPA</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {academicProgress.gpa?.toFixed(2) || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-book text-green-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Credits Earned
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {academicProgress.credits_earned}
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
                <p className="text-sm font-medium text-gray-500">
                  Assignments Done
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {completedAssignments}
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
                <p className="text-sm font-medium text-gray-500">Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(academicProgress.completion_percentage || 0).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Courses */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Current Courses
                  </h2>
                  <Link
                    to="/enrollments"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {enrollments.slice(0, 4).map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {enrollment.course.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {enrollment.course.code} •{" "}
                          {enrollment.course.lecturer} •{" "}
                          {enrollment.course.credits} credits
                        </p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span
                            className={`text-sm font-medium ${getGradeColor(
                              enrollment.final_grade
                            )}`}
                          >
                            Grade: {enrollment.final_grade || "In Progress"}
                          </span>
                          {enrollment.attendance_percentage && (
                            <span className="text-sm text-gray-600">
                              Attendance: {enrollment.attendance_percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            enrollment.status === "enrolled"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {enrollment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Assignments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Assignments
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {upcomingAssignments
                    .slice(0, 3)
                    .map((assignment) => (
                      <div
                        key={assignment.id}
                        className="border-l-4 border-primary-500 pl-4"
                      >
                        <h3 className="font-medium text-gray-900">
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {assignment.course_code}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-500">
                            Due:{" "}
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(
                              assignment.days_until_due
                            )}`}
                          >
                            {assignment.days_until_due} days
                          </span>
                        </div>
                      </div>
                    ))}
                  {upcomingAssignments.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No upcoming assignments
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
                    to="/courses"
                    className="flex items-center p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <i className="fas fa-search text-primary-600 mr-3"></i>
                    <span className="font-medium text-primary-700">
                      Browse Courses
                    </span>
                  </Link>

                  <Link
                    to="/course-materials"
                    className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <i className="fas fa-play-circle text-purple-600 mr-3"></i>
                    <span className="font-medium text-purple-700">
                      Course Materials
                    </span>
                  </Link>

                  <Link
                    to="/ask"
                    className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <i className="fas fa-robot text-blue-600 mr-3"></i>
                    <span className="font-medium text-blue-700">
                      Ask AI Tutor
                    </span>
                  </Link>

                  <Link
                    to="/student-assessments"
                    className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <i className="fas fa-question-circle text-green-600 mr-3"></i>
                    <span className="font-medium text-green-700">
                      Take Quiz
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Data Sections */}
        {recentGrades.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Grades</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentGrades.slice(0, 5).map((grade, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{grade.assignment_title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.course_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getGradeColor(grade.percentage.toString())}`}>
                            {grade.grade}/{grade.max_points} ({grade.percentage}%)
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(grade.graded_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-3">
              {notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className={`p-4 rounded-lg border ${notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 mr-3 ${notification.read ? 'bg-gray-400' : 'bg-blue-500'}`}></div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(notification.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h3 className="font-medium text-gray-900 mb-1">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  <p className="text-xs text-gray-500">Earned: {new Date(achievement.earned_date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
