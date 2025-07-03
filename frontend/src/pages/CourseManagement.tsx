import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  credits: number;
  department: string;
  department_name: string;
  department_id: number;
  lecturer: string;
  lecturer_id: number;
  semester: string;
  semester_id: number;
  max_capacity: number;
  enrolled_count: number;
  available_spots: number;
  is_active: boolean;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
  year: number;
  is_current: boolean;
}

interface Lecturer {
  id: number;
  name: string;
  email: string;
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    department: "",
    semester: "",
    status: "all",
  });

  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    description: "",
    credits: 3,
    department_id: 0,
    semester_id: 0,
    lecturer_id: 0,
    max_capacity: 30,
    prerequisites: "",
    syllabus: "",
  });

  const [lecturers, setLecturers] = useState<Lecturer[]>([]);

  useEffect(() => {
    fetchData();
    fetchLecturers();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch courses
      const coursesResponse = await fetch("/api/academic/courses", {
        credentials: "include",
      });
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData.courses);
      }

      // Fetch departments
      const deptResponse = await fetch("/api/academic/departments", {
        credentials: "include",
      });
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setDepartments(deptData.departments);
      }

      // Fetch semesters
      const semesterResponse = await fetch("/api/academic/semesters", {
        credentials: "include",
      });
      if (semesterResponse.ok) {
        const semesterData = await semesterResponse.json();
        setSemesters(semesterData.semesters);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturers = async () => {
    try {
      const response = await fetch("/api/users?role=lecturer", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setLecturers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch lecturers:", error);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newCourse),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewCourse({
          name: "",
          code: "",
          description: "",
          credits: 3,
          department_id: 0,
          semester_id: 0,
          lecturer_id: 0,
          max_capacity: 30,
          prerequisites: "",
          syllabus: "",
        });
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to create course");
      }
    } catch (error) {
      setError("Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId: number, force: boolean = false) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await fetch(`/api/courses/${courseId}?force=${force}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  const getStatusColor = (course: Course) => {
    if (!course.is_active) return "bg-gray-100 text-gray-800";
    if (course.enrolled_count >= course.max_capacity) return "bg-red-100 text-red-800";
    if (course.enrolled_count > course.max_capacity * 0.8) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusText = (course: Course) => {
    if (!course.is_active) return "Inactive";
    if (course.enrolled_count >= course.max_capacity) return "Full";
    if (course.enrolled_count > course.max_capacity * 0.8) return "Nearly Full";
    return "Available";
  };

  const filteredCourses = courses.filter((course) => {
    if (filters.department && course.department_name !== filters.department) return false;
    if (filters.semester && course.semester !== filters.semester) return false;
    if (filters.status === "active" && !course.is_active) return false;
    if (filters.status === "inactive" && course.is_active) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Management</h1>
          <p className="text-gray-600">Manage all courses in the system</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) =>
                  setFilters({ ...filters, department: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                value={filters.semester}
                onChange={(e) =>
                  setFilters({ ...filters, semester: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Semesters</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.name}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Course
              </button>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Courses ({filteredCourses.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lecturer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {course.code} - {course.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {course.credits} credits
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.lecturer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.semester}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.enrolled_count}/{course.max_capacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          course
                        )}`}
                      >
                        {getStatusText(course)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingCourse(course)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <Link
                          to={`/courses/${course.id}`}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              <i className="fas fa-book-open"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600">
              {courses.length === 0
                ? "Create your first course to get started."
                : "Try adjusting your filters."}
            </p>
          </div>
        )}
      </div>

      {/* View Course Modal */}
      {showViewModal && selectedCourse && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Course Details: {selectedCourse.code} - {selectedCourse.name}
                </h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedCourse(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Course Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Course Code:</dt>
                      <dd className="text-sm font-medium">{selectedCourse.code}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Course Name:</dt>
                      <dd className="text-sm font-medium">{selectedCourse.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Credits:</dt>
                      <dd className="text-sm font-medium">{selectedCourse.credits}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Department:</dt>
                      <dd className="text-sm font-medium">{selectedCourse.department}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Lecturer:</dt>
                      <dd className="text-sm font-medium">{selectedCourse.lecturer}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Semester:</dt>
                      <dd className="text-sm font-medium">{selectedCourse.semester}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Enrollment & Status</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Enrolled Students:</dt>
                      <dd className="text-sm font-medium">{selectedCourse.enrolled_count}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Max Capacity:</dt>
                      <dd className="text-sm font-medium">{selectedCourse.max_capacity}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Available Spots:</dt>
                      <dd className="text-sm font-medium">{selectedCourse.available_spots}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Status:</dt>
                      <dd className="text-sm font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedCourse)}`}>
                          {getStatusText(selectedCourse)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {selectedCourse.description && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedCourse.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Course
              </h3>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={newCourse.code}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={newCourse.department_id}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        department_id: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={newCourse.semester_id}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        semester_id: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    value={newCourse.credits}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        credits: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                    max="6"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    value={newCourse.max_capacity}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        max_capacity: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lecturer
                  </label>
                  <select
                    value={newCourse.lecturer_id || ""}
                    onChange={e => setNewCourse({ ...newCourse, lecturer_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Lecturer</option>
                    {lecturers.map(lect => (
                      <option key={lect.id} value={lect.id}>{lect.name} ({lect.email})</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setError(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Course"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Course</h3>
              <form onSubmit={async e => {
                e.preventDefault();
                setSubmitting(true);
                setError(null);
                try {
                  const response = await fetch(`/api/courses/${editingCourse.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(editingCourse),
                  });
                  if (response.ok) {
                    setEditingCourse(null);
                    fetchData();
                  } else {
                    const errorData = await response.json();
                    setError(errorData.detail || "Failed to update course");
                  }
                } catch (error) {
                  setError("Failed to update course");
                } finally {
                  setSubmitting(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                  <input type="text" value={editingCourse.name} onChange={e => setEditingCourse({ ...editingCourse, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                  <input type="text" value={editingCourse.code} onChange={e => setEditingCourse({ ...editingCourse, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={editingCourse.description} onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select value={editingCourse.department_id} onChange={e => setEditingCourse({ ...editingCourse, department_id: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select value={editingCourse.semester_id} onChange={e => setEditingCourse({ ...editingCourse, semester_id: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem.id} value={sem.id}>{sem.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input type="number" value={editingCourse.credits} onChange={e => setEditingCourse({ ...editingCourse, credits: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" min="1" max="6" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lecturer</label>
                  <select value={editingCourse.lecturer_id || ""} onChange={e => setEditingCourse({ ...editingCourse, lecturer_id: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                    <option value="">Select Lecturer</option>
                    {lecturers.map(lect => (
                      <option key={lect.id} value={lect.id}>{lect.name} ({lect.email})</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setEditingCourse(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50">{submitting ? "Saving..." : "Save Changes"}</button>
                </div>
                {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
