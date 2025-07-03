import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

interface Program {
  id: number;
  name: string;
  code: string;
  description: string;
  department: string;
  duration_years: number;
  total_credits: number;
  assignment_role: string;
  assigned_at: string;
  courses?: Array<{
    id: number;
    name: string;
    code: string;
    credits: number;
    is_required: boolean;
    semester_order: number;
    lecturer_name: string;
  }>;
  student_count?: number;
  created_at?: string;
}

const LecturerPrograms: React.FC = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/lecturer/programs`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      } else {
        setError("Failed to fetch programs");
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      setError("Failed to fetch programs");
    } finally {
      setLoading(false);
    }
  };

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(selectedProgram?.id === program.id ? null : program);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your programs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPrograms}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
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
            My Programs
          </h1>
          <p className="text-gray-600">
            Manage and view the programs you're assigned to teach.
          </p>
        </div>

        {programs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Programs Assigned
            </h3>
            <p className="text-gray-600">
              You haven't been assigned to any programs yet. Contact your administrator for program assignments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Programs List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    My Programs ({programs.length})
                  </h2>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {programs.map((program) => (
                      <div
                        key={program.id}
                        onClick={() => handleProgramSelect(program)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedProgram?.id === program.id
                            ? "border-primary-500 bg-primary-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {program.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {program.code}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 space-x-4">
                              <span>
                                <i className="fas fa-users mr-1"></i>
                                {program.student_count || 0} students
                              </span>
                              <span>
                                <i className="fas fa-book mr-1"></i>
                                {program.courses?.length || 0} courses
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                program.assignment_role === 'coordinator' ? 'bg-purple-100 text-purple-800' :
                                program.assignment_role === 'advisor' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {program.assignment_role}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <i
                              className={`fas fa-chevron-right text-gray-400 transition-transform ${
                                selectedProgram?.id === program.id ? "rotate-90" : ""
                              }`}
                            ></i>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Program Details */}
            <div className="lg:col-span-2">
              {selectedProgram ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {selectedProgram.name}
                        </h2>
                        <p className="text-gray-600">{selectedProgram.code}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Department</div>
                        <div className="font-medium text-gray-900">
                          {selectedProgram.department}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Program Overview */}
                    <div className="mb-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Program Overview
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500">Duration</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {selectedProgram.duration_years} years
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500">Total Credits</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {selectedProgram.total_credits}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500">Students</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {selectedProgram.student_count || 0}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500">Your Role</div>
                          <div className="text-lg font-semibold text-gray-900 capitalize">
                            {selectedProgram.assignment_role}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500">Assigned Since</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {new Date(selectedProgram.assigned_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {selectedProgram.description && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500 mb-2">Description</div>
                          <p className="text-gray-900">{selectedProgram.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Courses */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Program Courses ({selectedProgram.courses?.length || 0})
                      </h3>
                      {selectedProgram.courses && selectedProgram.courses.length > 0 ? (
                        <div className="space-y-3">
                          {selectedProgram.courses.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {course.name}
                                  </h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    course.is_required 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {course.is_required ? 'Required' : 'Optional'}
                                  </span>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Semester {course.semester_order}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{course.code}</p>
                                <p className="text-xs text-gray-500">
                                  Lecturer: {course.lecturer_name}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">Credits</div>
                                <div className="font-medium text-gray-900">
                                  {course.credits}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <i className="fas fa-book text-4xl mb-2"></i>
                          <p>No courses allocated to this program yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="text-gray-400 text-6xl mb-4">
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Program
                  </h3>
                  <p className="text-gray-600">
                    Choose a program from the list to view its details and courses.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerPrograms; 