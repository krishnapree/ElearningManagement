import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  lecturers: Lecturer[];
  programs: Program[];
  courses: Course[];
  statistics: {
    total_lecturers: number;
    total_programs: number;
    total_courses: number;
    total_students: number;
  };
}

interface Lecturer {
  id: number;
  name: string;
  email: string;
  employee_id: string;
  is_active: boolean;
}

interface Program {
  id: number;
  name: string;
  code: string;
  program_type: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  lecturer_name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const DepartmentDetails: React.FC = () => {
  const { user } = useAuth();
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [availableLecturers, setAvailableLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "lecturers" | "programs" | "courses">("overview");
  
  // Assignment modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (departmentId) {
      fetchDepartmentDetails();
      fetchAvailableLecturers();
    }
  }, [departmentId]);

  const fetchDepartmentDetails = async () => {
    try {
      const response = await fetch(`/api/academic/departments/${departmentId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setDepartment(data.department);
      } else {
        setError("Failed to fetch department details");
      }
    } catch (error) {
      console.error("Error fetching department details:", error);
      setError("Failed to fetch department details");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableLecturers = async () => {
    try {
      const response = await fetch(`/api/users?role=lecturer&unassigned=true`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableLecturers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching lecturers:", error);
    }
  };

  const handleAssignLecturer = async () => {
    if (!selectedLecturer) return;

    try {
      setAssigning(true);
      const response = await fetch(`/api/academic/departments/${departmentId}/assign-lecturer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          lecturer_id: parseInt(selectedLecturer),
        }),
      });

      if (response.ok) {
        await fetchDepartmentDetails();
        await fetchAvailableLecturers();
        setShowAssignModal(false);
        setSelectedLecturer("");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to assign lecturer");
      }
    } catch (error) {
      console.error("Error assigning lecturer:", error);
      setError("Failed to assign lecturer");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading department details...</p>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-gray-400 text-3xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || "Department Not Found"}
          </h3>
          <p className="text-gray-600 mb-6">
            The requested department could not be found or loaded.
          </p>
          <Link
            to="/departments"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Departments
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
              to="/departments"
              className="text-gray-500 hover:text-gray-700 mr-4"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Departments
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mr-4">
                  {department.name}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    department.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {department.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-gray-600 mb-4">
                <span className="flex items-center">
                  <i className="fas fa-code mr-2"></i>
                  {department.code}
                </span>
                <span className="flex items-center">
                  <i className="fas fa-calendar mr-2"></i>
                  Created {new Date(department.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {user?.role === "admin" && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Assign Lecturer
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chalkboard-teacher text-blue-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Lecturers</p>
                <p className="text-2xl font-semibold text-gray-900">{department.statistics.total_lecturers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-green-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Programs</p>
                <p className="text-2xl font-semibold text-gray-900">{department.statistics.total_programs}</p>
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
                <p className="text-sm font-medium text-gray-500">Courses</p>
                <p className="text-2xl font-semibold text-gray-900">{department.statistics.total_courses}</p>
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
                <p className="text-sm font-medium text-gray-500">Students</p>
                <p className="text-2xl font-semibold text-gray-900">{department.statistics.total_students}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="fas fa-info-circle mr-2"></i>
                Overview
              </button>
              <button
                onClick={() => setActiveTab("lecturers")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "lecturers"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="fas fa-chalkboard-teacher mr-2"></i>
                Lecturers ({department.lecturers.length})
              </button>
              <button
                onClick={() => setActiveTab("programs")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "programs"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="fas fa-graduation-cap mr-2"></i>
                Programs ({department.programs.length})
              </button>
              <button
                onClick={() => setActiveTab("courses")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "courses"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="fas fa-book mr-2"></i>
                Courses ({department.courses.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Department Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {department.description || "No description available for this department."}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "lecturers" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Department Lecturers
                </h3>
                {department.lecturers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-chalkboard-teacher text-gray-400 text-xl"></i>
                    </div>
                    <p className="text-gray-500">No lecturers assigned to this department.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {department.lecturers.map((lecturer) => (
                      <div key={lecturer.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{lecturer.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{lecturer.email}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Employee ID: {lecturer.employee_id || "N/A"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              lecturer.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {lecturer.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "programs" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Department Programs
                </h3>
                {department.programs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-graduation-cap text-gray-400 text-xl"></i>
                    </div>
                    <p className="text-gray-500">No programs available in this department.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {department.programs.map((program) => (
                      <div key={program.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{program.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{program.code}</p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              program.program_type === "bachelor"
                                ? "bg-blue-100 text-blue-800"
                                : program.program_type === "master"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {program.program_type.charAt(0).toUpperCase() + program.program_type.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "courses" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Department Courses
                </h3>
                {department.courses.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-book text-gray-400 text-xl"></i>
                    </div>
                    <p className="text-gray-500">No courses available in this department.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {department.courses.map((course) => (
                      <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{course.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{course.code}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Lecturer: {course.lecturer_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Assign Lecturer Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign Lecturer to {department.name}
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Lecturer
                  </label>
                  <select
                    value={selectedLecturer}
                    onChange={(e) => setSelectedLecturer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Choose a lecturer...</option>
                    {availableLecturers.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.name} ({lecturer.email})
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedLecturer("");
                      setError(null);
                    }}
                    disabled={assigning}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignLecturer}
                    disabled={assigning || !selectedLecturer}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {assigning ? "Assigning..." : "Assign"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentDetails;
