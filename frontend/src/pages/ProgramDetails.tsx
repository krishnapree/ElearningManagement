import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

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
}

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  credits: number;
  department: string;
  lecturer: string;
  semester: string;
  max_capacity: number;
  enrolled_count: number;
  available_spots: number;
}

const ProgramDetails: React.FC = () => {
  const { user } = useAuth();
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "students">("overview");

  useEffect(() => {
    if (programId) {
      fetchProgramDetails();
      fetchProgramCourses();
    }
  }, [programId]);

  const fetchProgramDetails = async () => {
    try {
      const response = await fetch(`/api/academic/programs`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const foundProgram = data.programs?.find((p: Program) => p.id === parseInt(programId!));
        
        if (foundProgram) {
          setProgram(foundProgram);
        } else {
          setError("Program not found");
        }
      } else {
        setError("Failed to fetch program details");
      }
    } catch (error) {
      console.error("Error fetching program details:", error);
      setError("Failed to fetch program details");
    }
  };

  const fetchProgramCourses = async () => {
    try {
      const response = await fetch(`/api/academic/courses`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-gray-400 text-3xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || "Program Not Found"}
          </h3>
          <p className="text-gray-600 mb-6">
            The requested program could not be found or loaded.
          </p>
          <Link
            to="/programs"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Programs
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
              to="/programs"
              className="text-gray-500 hover:text-gray-700 mr-4"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Programs
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mr-4">
                  {program.name}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    program.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {program.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-gray-600 mb-4">
                <span className="flex items-center">
                  <i className="fas fa-code mr-2"></i>
                  {program.code}
                </span>
                <span className="flex items-center">
                  <i className="fas fa-building mr-2"></i>
                  {program.department_name}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    program.program_type === "bachelor"
                      ? "bg-blue-100 text-blue-800"
                      : program.program_type === "master"
                      ? "bg-purple-100 text-purple-800"
                      : program.program_type === "phd"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {program.program_type.charAt(0).toUpperCase() + program.program_type.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-blue-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-2xl font-semibold text-gray-900">{program.duration_years}</p>
                <p className="text-xs text-gray-500">years</p>
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
                <p className="text-sm font-medium text-gray-500">Total Credits</p>
                <p className="text-2xl font-semibold text-gray-900">{program.total_credits}</p>
                <p className="text-xs text-gray-500">credits</p>
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
                <p className="text-sm font-medium text-gray-500">Total Courses</p>
                <p className="text-2xl font-semibold text-gray-900">{program.total_courses}</p>
                <p className="text-xs text-gray-500">courses</p>
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
                <p className="text-sm font-medium text-gray-500">Enrolled Students</p>
                <p className="text-2xl font-semibold text-gray-900">{program.enrolled_students}</p>
                <p className="text-xs text-gray-500">students</p>
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
                onClick={() => setActiveTab("courses")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "courses"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="fas fa-book mr-2"></i>
                Courses ({courses.length})
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "students"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="fas fa-users mr-2"></i>
                Students ({program.enrolled_students})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Program Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {program.description || "No description available for this program."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Program Information
                    </h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Program Type:</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {program.program_type.charAt(0).toUpperCase() + program.program_type.slice(1)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Department:</dt>
                        <dd className="text-sm font-medium text-gray-900">{program.department_name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Duration:</dt>
                        <dd className="text-sm font-medium text-gray-900">{program.duration_years} years</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Total Credits:</dt>
                        <dd className="text-sm font-medium text-gray-900">{program.total_credits}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Status:</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {program.is_active ? "Active" : "Inactive"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Created:</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {new Date(program.created_at).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "courses" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Program Courses
                </h3>
                {courses.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-book text-gray-400 text-xl"></i>
                    </div>
                    <p className="text-gray-500">No courses available for this program.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {courses.map((course) => (
                      <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{course.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {course.code} • {course.credits} credits • {course.lecturer}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">{course.description}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>{course.enrolled_count}/{course.max_capacity} enrolled</div>
                            <div className="text-xs mt-1">{course.semester}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "students" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Enrolled Students
                </h3>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-users text-gray-400 text-xl"></i>
                  </div>
                  <p className="text-gray-500">Student enrollment details will be available soon.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramDetails;
