import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  credits: number;
  max_capacity: number;
  enrolled_count: number;
  department_name: string;
  semester_name: string;
  is_active: boolean;
  syllabus?: string;
  prerequisites?: string;
  lecturer_name?: string;
  materials_count?: number;
  assignments_count?: number;
  lessons_count?: number;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  assignment_type: string;
  is_published: boolean;
  submission_count: number;
  graded_count: number;
  created_at: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  student_id: string;
  enrollment_date: string;
  attendance_percentage: number;
  current_grade: number;
  last_activity: string;
}

interface Material {
  id: number;
  title: string;
  type: "pdf" | "video" | "document" | "link";
  file_path?: string;
  url?: string;
  uploaded_at: string;
  size?: string;
  description?: string;
}

interface Submission {
  id: number;
  student_name: string;
  student_email: string;
  assignment_title: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  is_late: boolean;
  file_name?: string;
}

const LecturerCourseDetails: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "students"
    | "assignments"
    | "materials"
    | "submissions"
    | "analytics"
  >("overview");
  const [loading, setLoading] = useState(true);

  // Tab-specific data
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  useEffect(() => {
    if (course && activeTab !== "overview") {
      fetchTabData();
    }
  }, [activeTab, course]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async () => {
    if (!course) return;

    try {
      switch (activeTab) {
        case "students":
          const studentsResponse = await fetch(
            `/api/courses/${course.id}/students`,
            {
              credentials: "include",
            }
          );
          if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            setStudents(studentsData.students || []);
          }
          break;

        case "assignments":
          const assignmentsResponse = await fetch(
            `/api/courses/${course.id}/assignments`,
            {
              credentials: "include",
            }
          );
          if (assignmentsResponse.ok) {
            const assignmentsData = await assignmentsResponse.json();
            setAssignments(assignmentsData.assignments || []);
          }
          break;

        case "materials":
          const materialsResponse = await fetch(
            `/api/courses/${course.id}/materials`,
            {
              credentials: "include",
            }
          );
          if (materialsResponse.ok) {
            const materialsData = await materialsResponse.json();
            setMaterials(materialsData.materials || []);
          }
          break;

        case "submissions":
          const submissionsResponse = await fetch(
            `/api/courses/${course.id}/submissions`,
            {
              credentials: "include",
            }
          );
          if (submissionsResponse.ok) {
            const submissionsData = await submissionsResponse.json();
            setSubmissions(submissionsData.submissions || []);
          }
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} data:`, error);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "overview":
        return "fas fa-chart-line";
      case "students":
        return "fas fa-users";
      case "assignments":
        return "fas fa-tasks";
      case "materials":
        return "fas fa-folder-open";
      case "submissions":
        return "fas fa-file-alt";
      case "analytics":
        return "fas fa-analytics";
      default:
        return "fas fa-circle";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-gray-400 text-3xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Course Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The requested course could not be found.
          </p>
          <Link
            to="/my-courses"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to My Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              to="/my-courses"
              className="text-gray-500 hover:text-gray-700 mr-4"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Courses
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {course.code} - {course.name}
              </h1>
              <p className="text-gray-600">
                {course.department_name} • {course.semester_name} •{" "}
                {course.credits} Credits
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  course.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {course.is_active ? "Active" : "Inactive"}
              </span>
              <div className="text-right">
                <div className="text-sm text-gray-500">Enrollment</div>
                <div className="text-lg font-semibold text-gray-900">
                  {course.enrolled_count}/{course.max_capacity}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: "overview", label: "Overview" },
                { key: "students", label: "Students" },
                { key: "assignments", label: "Assignments" },
                { key: "materials", label: "Materials" },
                { key: "submissions", label: "Submissions" },
                { key: "analytics", label: "Analytics" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <i className={`${getTabIcon(tab.key)} mr-2`}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Description
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {course.description || "No description available."}
                </p>

                {course.prerequisites && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Prerequisites
                    </h4>
                    <p className="text-gray-600">{course.prerequisites}</p>
                  </div>
                )}

                {course.syllabus && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Syllabus</h4>
                    <p className="text-gray-600">{course.syllabus}</p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {course.enrolled_count}
                  </div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {assignments.length}
                  </div>
                  <div className="text-sm text-gray-600">Assignments</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {materials.length}
                  </div>
                  <div className="text-sm text-gray-600">Materials</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {submissions.length}
                  </div>
                  <div className="text-sm text-gray-600">Submissions</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    to={`/upload-materials/${courseId}`}
                    className="w-full flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                  >
                    <i className="fas fa-upload text-green-600 mr-3"></i>
                    <span className="font-medium text-green-700">
                      Upload Material
                    </span>
                  </Link>

                  <Link
                    to={`/course-playlist/${courseId}`}
                    className="w-full flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                  >
                    <i className="fas fa-play-circle text-blue-600 mr-3"></i>
                    <span className="font-medium text-blue-700">
                      View Materials
                    </span>
                  </Link>

                  <button
                    onClick={() => setActiveTab("students")}
                    className="w-full flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  >
                    <i className="fas fa-users text-purple-600 mr-3"></i>
                    <span className="font-medium text-purple-700">
                      View Students
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("submissions")}
                    className="w-full flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
                  >
                    <i className="fas fa-file-alt text-orange-600 mr-3"></i>
                    <span className="font-medium text-orange-700">
                      Grade Submissions
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Enrolled Students
                </h2>
                <div className="text-sm text-gray-500">
                  {students.length} students enrolled
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(student.enrollment_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.current_grade >= 90
                              ? "bg-green-100 text-green-800"
                              : student.current_grade >= 80
                              ? "bg-blue-100 text-blue-800"
                              : student.current_grade >= 70
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {student.current_grade}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{
                                width: `${student.attendance_percentage}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {student.attendance_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.last_activity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Course Assignments
              </h2>
            </div>

            <div className="grid gap-6">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {assignment.title}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {assignment.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          <i className="fas fa-calendar mr-1"></i>
                          Due:{" "}
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                        <span>
                          <i className="fas fa-star mr-1"></i>
                          {assignment.max_points} points
                        </span>
                        <span>
                          <i className="fas fa-tag mr-1"></i>
                          {assignment.assignment_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.is_published
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {assignment.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">
                        <i className="fas fa-file-alt mr-1"></i>
                        {assignment.submission_count} submissions
                      </span>
                      <span className="text-gray-600">
                        <i className="fas fa-check-circle mr-1"></i>
                        {assignment.graded_count} graded
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </button>
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        <i className="fas fa-eye mr-1"></i>
                        View Submissions
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerCourseDetails;
