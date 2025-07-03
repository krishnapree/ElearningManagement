import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Program {
  id: number;
  name: string;
  code: string;
  description: string;
  program_type: string;
  duration_years: number;
  total_credits: number;
  department_name: string;
  department_id: number;
  total_courses: number;
  enrolled_students: number;
  is_active: boolean;
  created_at: string;
  lecturers?: Lecturer[];
}

interface Lecturer {
  id: number;
  name: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  credits: number;
  department_name: string;
  lecturer_name: string;
  is_active: boolean;
  is_allocated?: boolean;
}

interface CourseAllocation {
  id: number;
  course_id: number;
  program_id: number;
  course_name: string;
  course_code: string;
  credits: number;
  allocated_at: string;
  is_required: boolean;
  semester_order: number;
}

const ProgramManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    department: "",
    type: "all",
    status: "all",
  });

  const [departments, setDepartments] = useState<Department[]>([]);

  const [newProgram, setNewProgram] = useState({
    name: "",
    code: "",
    description: "",
    program_type: "Bachelor",
    department_id: 0,
    duration_years: 4,
    total_credits: 120,
  });

  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [selectedLecturers, setSelectedLecturers] = useState<number[]>([]);
  const [editSelectedLecturers, setEditSelectedLecturers] = useState<number[]>([]);

  // New state for lecturer assignment management
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [selectedProgramForLecturers, setSelectedProgramForLecturers] = useState<Program | null>(null);
  const [programLecturers, setProgramLecturers] = useState<any[]>([]);
  const [newLecturerAssignment, setNewLecturerAssignment] = useState({
    lecturer_id: 0,
    role: "lecturer"
  });

  // New state for course allocation management
  const [showCourseAllocationModal, setShowCourseAllocationModal] = useState(false);
  const [selectedProgramForCourses, setSelectedProgramForCourses] = useState<Program | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [allocatedCourses, setAllocatedCourses] = useState<CourseAllocation[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [courseAllocationForm, setCourseAllocationForm] = useState({
    course_id: 0,
    is_required: true,
    semester_order: 1
  });

  useEffect(() => {
    fetchPrograms();
    fetchLecturers();
    fetchDepartments();
  }, [filters]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/academic/programs", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
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

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/academic/departments", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/academic/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ...newProgram, lecturers: selectedLecturers }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewProgram({
          name: "",
          code: "",
          description: "",
          program_type: "Bachelor",
          department_id: 0,
          duration_years: 4,
          total_credits: 120,
        });
        fetchPrograms();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to create program");
      }
    } catch (error) {
      setError("Failed to create program");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgram = async (
    programId: number,
    updates: Partial<Program>
  ) => {
    try {
      const response = await fetch(`/api/academic/programs/${programId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ...updates, lecturers: editSelectedLecturers }),
      });

      if (response.ok) {
        setEditingProgram(null);
        fetchPrograms();
      }
    } catch (error) {
      console.error("Failed to update program:", error);
    }
  };

  const handleDeleteProgram = async (programId: number) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    try {
      const response = await fetch(`/api/academic/programs/${programId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        fetchPrograms();
      }
    } catch (error) {
      console.error("Failed to delete program:", error);
    }
  };

  const handleViewProgram = async (programId: number) => {
    try {
      const response = await fetch(`/api/academic/programs/${programId}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedProgram(data.program);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch program details:", error);
    }
  };

  // New functions for lecturer assignment management
  const handleManageLecturers = async (program: Program) => {
    setSelectedProgramForLecturers(program);
    await fetchProgramLecturers(program.id);
    setShowLecturerModal(true);
  };

  const fetchProgramLecturers = async (programId: number) => {
    try {
      const response = await fetch(`/api/academic/programs/${programId}/lecturers`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgramLecturers(data.lecturers || []);
      }
    } catch (error) {
      console.error("Failed to fetch program lecturers:", error);
    }
  };

  const handleAssignLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramForLecturers) return;

    try {
      const response = await fetch(`/api/academic/programs/${selectedProgramForLecturers.id}/lecturers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newLecturerAssignment),
      });

      if (response.ok) {
        setNewLecturerAssignment({ lecturer_id: 0, role: "lecturer" });
        await fetchProgramLecturers(selectedProgramForLecturers.id);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to assign lecturer");
      }
    } catch (error) {
      setError("Failed to assign lecturer");
    }
  };

  const handleRemoveLecturer = async (assignmentId: number) => {
    if (!selectedProgramForLecturers) return;
    if (!confirm("Are you sure you want to remove this lecturer from the program?")) return;

    try {
      const response = await fetch(`/api/academic/programs/${selectedProgramForLecturers.id}/lecturers/${assignmentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await fetchProgramLecturers(selectedProgramForLecturers.id);
      }
    } catch (error) {
      console.error("Failed to remove lecturer:", error);
    }
  };

  const handleUpdateLecturerRole = async (assignmentId: number, newRole: string) => {
    if (!selectedProgramForLecturers) return;

    try {
      const response = await fetch(`/api/academic/programs/${selectedProgramForLecturers.id}/lecturers/${assignmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        await fetchProgramLecturers(selectedProgramForLecturers.id);
      }
    } catch (error) {
      console.error("Failed to update lecturer role:", error);
    }
  };

  // Course allocation functions
  const handleManageCourses = async (program: Program) => {
    setSelectedProgramForCourses(program);
    await fetchAvailableCourses(program.department_id);
    await fetchAllocatedCourses(program.id);
    setShowCourseAllocationModal(true);
  };

  const fetchAvailableCourses = async (departmentId: number) => {
    try {
      const response = await fetch(`/api/academic/courses?department_id=${departmentId}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        const allCourses = data.courses || [];
        
        // Filter out courses that are already allocated to this program
        const allocatedCourseIds = allocatedCourses.map(ac => ac.course_id);
        const availableCourses = allCourses.filter((course: Course) => 
          !allocatedCourseIds.includes(course.id)
        );
        
        setAvailableCourses(availableCourses);
      }
    } catch (error) {
      console.error("Failed to fetch available courses:", error);
    }
  };

  const fetchAllocatedCourses = async (programId: number) => {
    try {
      const response = await fetch(`/api/academic/programs/${programId}/courses`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllocatedCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Failed to fetch allocated courses:", error);
    }
  };

  const handleAllocateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramForCourses || !courseAllocationForm.course_id) return;

    try {
      const response = await fetch(`/api/academic/programs/${selectedProgramForCourses.id}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(courseAllocationForm),
      });

      if (response.ok) {
        setCourseAllocationForm({ course_id: 0, is_required: true, semester_order: 1 });
        await fetchAllocatedCourses(selectedProgramForCourses.id);
        await fetchAvailableCourses(selectedProgramForCourses.department_id);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to allocate course");
      }
    } catch (error) {
      setError("Failed to allocate course");
    }
  };

  const handleRemoveCourseAllocation = async (allocationId: number) => {
    if (!selectedProgramForCourses) return;
    if (!confirm("Are you sure you want to remove this course from the program?")) return;

    try {
      const response = await fetch(`/api/academic/programs/${selectedProgramForCourses.id}/courses/${allocationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await fetchAllocatedCourses(selectedProgramForCourses.id);
        await fetchAvailableCourses(selectedProgramForCourses.department_id);
      }
    } catch (error) {
      console.error("Failed to remove course allocation:", error);
    }
  };

  const handleUpdateCourseAllocation = async (allocationId: number, updates: any) => {
    if (!selectedProgramForCourses) return;

    try {
      const response = await fetch(`/api/academic/programs/${selectedProgramForCourses.id}/courses/${allocationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchAllocatedCourses(selectedProgramForCourses.id);
      }
    } catch (error) {
      console.error("Failed to update course allocation:", error);
    }
  };

  const filteredPrograms = programs.filter((program) => {
    if (filters.department && program.department_name !== filters.department) return false;
    if (filters.type !== "all" && program.program_type !== filters.type) return false;
    if (filters.status === "active" && !program.is_active) return false;
    if (filters.status === "inactive" && program.is_active) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Program Management</h1>
          <p className="text-gray-600">Manage academic programs and degree offerings</p>
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
                {Array.from(new Set(programs.map(p => p.department_name))).map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Type
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
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
                Create Program
              </button>
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {program.name}
                  </h3>
                  <p className="text-sm text-gray-500">{program.code}</p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    program.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {program.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mb-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    program.program_type === "Bachelor"
                      ? "bg-blue-100 text-blue-800"
                      : program.program_type === "Master"
                      ? "bg-purple-100 text-purple-800"
                      : program.program_type === "PhD"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {program.program_type}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {program.description}
              </p>

              {/* Program Details */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium">
                    {program.duration_years} years
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Credits:</span>
                  <span className="font-medium">{program.total_credits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Courses:</span>
                  <span className="font-medium">{program.total_courses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Enrolled:</span>
                  <span className="font-medium">
                    {program.enrolled_students}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingProgram(program)}
                  className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors"
                >
                  <i className="fas fa-edit mr-1"></i>
                  Edit
                </button>
                <button
                  onClick={() => handleViewProgram(program.id)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <i className="fas fa-eye mr-1"></i>
                  View
                </button>
                <button
                  onClick={() => handleManageLecturers(program)}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  <i className="fas fa-users mr-1"></i>
                  Lecturers
                </button>
                <button
                  onClick={() => handleManageCourses(program)}
                  className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                >
                  <i className="fas fa-book mr-1"></i>
                  Courses
                </button>
                <button
                  onClick={() => handleDeleteProgram(program.id)}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  <i className="fas fa-trash mr-1"></i>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPrograms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No programs found
            </h3>
            <p className="text-gray-600">
              {programs.length === 0
                ? "Create your first program to get started."
                : "Try adjusting your filters."}
            </p>
          </div>
        )}

        {/* Program Overview */}
        {programs.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Program Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {programs.length}
                </div>
                <div className="text-sm text-gray-500">Total Programs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {programs.reduce((sum, prog) => sum + prog.total_courses, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {programs.reduce(
                    (sum, prog) => sum + prog.enrolled_students,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-500">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {programs.filter((p) => p.is_active).length}
                </div>
                <div className="text-sm text-gray-500">Active Programs</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Program Modal */}
      {showViewModal && selectedProgram && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Program Details: {selectedProgram.code} - {selectedProgram.name}
                </h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedProgram(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Program Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Program Code:</dt>
                      <dd className="text-sm font-medium">{selectedProgram.code}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Program Name:</dt>
                      <dd className="text-sm font-medium">{selectedProgram.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Program Type:</dt>
                      <dd className="text-sm font-medium">{selectedProgram.program_type}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Department:</dt>
                      <dd className="text-sm font-medium">{selectedProgram.department_name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Duration:</dt>
                      <dd className="text-sm font-medium">{selectedProgram.duration_years} years</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Total Credits:</dt>
                      <dd className="text-sm font-medium">{selectedProgram.total_credits}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Total Courses:</dt>
                      <dd className="text-sm font-medium">{selectedProgram.total_courses}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Enrolled Students:</dt>
                      <dd className="text-sm font-medium">{selectedProgram.enrolled_students}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Status:</dt>
                      <dd className="text-sm font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedProgram.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {selectedProgram.is_active ? "Active" : "Inactive"}
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Created:</dt>
                      <dd className="text-sm font-medium">
                        {new Date(selectedProgram.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {selectedProgram.description && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedProgram.description}</p>
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Assigned Lecturers</h4>
                <ul className="list-disc pl-5">
                  {(selectedProgram.lecturers || []).map((lect: Lecturer) => (
                    <li key={lect.id}>{lect.name} ({lect.email})</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Program
              </h3>
              <form onSubmit={handleCreateProgram} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Name
                  </label>
                  <input
                    type="text"
                    value={newProgram.name}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Code
                  </label>
                  <input
                    type="text"
                    value={newProgram.code}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, code: e.target.value })
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
                    value={newProgram.description}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Type
                  </label>
                  <select
                    value={newProgram.program_type}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
                        program_type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    value={newProgram.duration_years}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
                        duration_years: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                    max="8"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Credits
                  </label>
                  <input
                    type="number"
                    value={newProgram.total_credits}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
                        total_credits: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={newProgram.department_id}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Lecturers</label>
                  <select
                    multiple
                    value={selectedLecturers.map(String)}
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                      setSelectedLecturers(options);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
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
                    {submitting ? "Creating..." : "Create Program"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {editingProgram && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Program</h3>
              <form onSubmit={async e => {
                e.preventDefault();
                setSubmitting(true);
                setError(null);
                try {
                  const response = await fetch(`/api/academic/programs/${editingProgram.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ ...editingProgram, lecturers: editSelectedLecturers }),
                  });
                  if (response.ok) {
                    setEditingProgram(null);
                    fetchPrograms();
                  } else {
                    const errorData = await response.json();
                    setError(errorData.detail || "Failed to update program");
                  }
                } catch (error) {
                  setError("Failed to update program");
                } finally {
                  setSubmitting(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                  <input type="text" value={editingProgram.name} onChange={e => setEditingProgram({ ...editingProgram, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Code</label>
                  <input type="text" value={editingProgram.code} onChange={e => setEditingProgram({ ...editingProgram, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={editingProgram.description} onChange={e => setEditingProgram({ ...editingProgram, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Type</label>
                  <select value={editingProgram.program_type} onChange={e => setEditingProgram({ ...editingProgram, program_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Years)</label>
                  <input type="number" value={editingProgram.duration_years} onChange={e => setEditingProgram({ ...editingProgram, duration_years: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" min="1" max="8" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Credits</label>
                  <input type="number" value={editingProgram.total_credits} onChange={e => setEditingProgram({ ...editingProgram, total_credits: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={editingProgram.department_id || 0}
                    onChange={(e) =>
                      setEditingProgram({
                        ...editingProgram,
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Lecturers</label>
                  <select
                    multiple
                    value={editSelectedLecturers.map(String)}
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                      setEditSelectedLecturers(options);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {lecturers.map(lect => (
                      <option key={lect.id} value={lect.id}>{lect.name} ({lect.email})</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setEditingProgram(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50">{submitting ? "Saving..." : "Save Changes"}</button>
                </div>
                {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lecturer Management Modal */}
      {showLecturerModal && selectedProgramForLecturers && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Lecturers: {selectedProgramForLecturers.name}
                </h3>
                <button
                  onClick={() => {
                    setShowLecturerModal(false);
                    setSelectedProgramForLecturers(null);
                    setProgramLecturers([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assign New Lecturer */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Assign New Lecturer</h4>
                  <form onSubmit={handleAssignLecturer} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Lecturer
                      </label>
                      <select
                        value={newLecturerAssignment.lecturer_id}
                        onChange={(e) =>
                          setNewLecturerAssignment({
                            ...newLecturerAssignment,
                            lecturer_id: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="">Select Lecturer</option>
                        {lecturers
                          .filter(lect => !programLecturers.some(pl => pl.lecturer_id === lect.id))
                          .map((lect) => (
                            <option key={lect.id} value={lect.id}>
                              {lect.name} ({lect.email})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={newLecturerAssignment.role}
                        onChange={(e) =>
                          setNewLecturerAssignment({
                            ...newLecturerAssignment,
                            role: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="lecturer">Lecturer</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="advisor">Advisor</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Assign Lecturer
                    </button>
                  </form>
                </div>

                {/* Current Lecturers */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Current Lecturers ({programLecturers.length})</h4>
                  {programLecturers.length > 0 ? (
                    <div className="space-y-3">
                      {programLecturers.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {assignment.lecturer_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {assignment.lecturer_email}
                            </div>
                            <div className="text-xs text-gray-500">
                              Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={assignment.role}
                              onChange={(e) => handleUpdateLecturerRole(assignment.id, e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="lecturer">Lecturer</option>
                              <option value="coordinator">Coordinator</option>
                              <option value="advisor">Advisor</option>
                            </select>
                            <button
                              onClick={() => handleRemoveLecturer(assignment.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-users text-4xl mb-2"></i>
                      <p>No lecturers assigned to this program yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course Allocation Modal */}
      {showCourseAllocationModal && selectedProgramForCourses && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Course Allocations: {selectedProgramForCourses.name}
                </h3>
                <button
                  onClick={() => {
                    setShowCourseAllocationModal(false);
                    setSelectedProgramForCourses(null);
                    setAvailableCourses([]);
                    setAllocatedCourses([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assign New Course */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Assign New Course</h4>
                  <form onSubmit={handleAllocateCourse} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Course
                      </label>
                      <select
                        value={courseAllocationForm.course_id}
                        onChange={(e) =>
                          setCourseAllocationForm({
                            ...courseAllocationForm,
                            course_id: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="">Select Course</option>
                        {availableCourses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.code} - {course.name} ({course.credits} credits)
                          </option>
                        ))}
                      </select>
                      {availableCourses.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          No available courses to allocate. All department courses are already allocated.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_required"
                        checked={courseAllocationForm.is_required}
                        onChange={(e) =>
                          setCourseAllocationForm({
                            ...courseAllocationForm,
                            is_required: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="is_required" className="text-sm font-medium text-gray-700">
                        Required Course
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Semester Order
                      </label>
                      <input
                        type="number"
                        value={courseAllocationForm.semester_order}
                        onChange={(e) =>
                          setCourseAllocationForm({
                            ...courseAllocationForm,
                            semester_order: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="1"
                        max="8"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Which semester this course should be taken (1-8)
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={availableCourses.length === 0}
                      className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Assign Course
                    </button>
                  </form>
                </div>

                {/* Current Allocations */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Current Allocations ({allocatedCourses.length})</h4>
                  {allocatedCourses.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {allocatedCourses.map((allocation) => (
                        <div
                          key={allocation.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {allocation.course_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {allocation.course_code} • {allocation.credits} credits
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Semester {allocation.semester_order} • Allocated: {new Date(allocation.allocated_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={allocation.is_required}
                                  onChange={(e) => handleUpdateCourseAllocation(allocation.id, { is_required: e.target.checked })}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-xs text-gray-600">Required</span>
                              </div>
                              <button
                                onClick={() => handleRemoveCourseAllocation(allocation.id)}
                                className="text-red-600 hover:text-red-800 text-sm p-1"
                                title="Remove course allocation"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-book text-4xl mb-2"></i>
                      <p>No courses allocated to this program yet.</p>
                      <p className="text-sm mt-1">Use the form on the left to allocate courses.</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramManagement;
