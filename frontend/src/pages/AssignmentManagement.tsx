import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

interface Assignment {
  id: number;
  title: string;
  description: string;
  course_id: string;
  course_code: string;
  course_name: string;
  due_date: string;
  max_points: number;
  assignment_type: string;
  instructions: string;
  is_published: boolean;
  submission_count: number;
  graded_count: number;
}

interface Course {
  id: string;
  code: string;
  name: string;
}

interface Submission {
  id: number;
  student_name: string;
  student_email: string;
  submitted_at: string;
  is_late: boolean;
  grade?: number;
}

const AssignmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [activeTab, setActiveTab] = useState<"assignments" | "grading">(
    "assignments"
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(
    null
  );

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    course_id: "",
    due_date: "",
    max_points: 100,
    assignment_type: "homework",
    instructions: "",
  });

  const [gradeForm, setGradeForm] = useState({
    grade: "",
    feedback: "",
  });

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions(selectedAssignment.id);
    }
  }, [selectedAssignment]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/assignments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchSubmissions = async (assignmentId: number) => {
    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/submissions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newAssignment),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewAssignment({
          title: "",
          description: "",
          course_id: "",
          due_date: "",
          max_points: 100,
          assignment_type: "homework",
          instructions: "",
        });
        fetchAssignments();
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
    }
  };

  const handleGradeSubmission = async (submissionId: number) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          grade: parseFloat(gradeForm.grade),
          feedback: gradeForm.feedback,
        }),
      });

      if (response.ok) {
        setGradingSubmission(null);
        setGradeForm({ grade: "", feedback: "" });
        if (selectedAssignment) {
          fetchSubmissions(selectedAssignment.id);
        }
        fetchAssignments();
      }
    } catch (error) {
      console.error("Error grading submission:", error);
    }
  };

  const getAssignmentStatusColor = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);

    if (!assignment.is_published) return "bg-gray-100 text-gray-800";
    if (dueDate < now) return "bg-red-100 text-red-800";
    if (dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000)
      return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getAssignmentStatusText = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);

    if (!assignment.is_published) return "Draft";
    if (dueDate < now) return "Overdue";
    if (dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000)
      return "Due Soon";
    return "Active";
  };

  const getGradeColor = (grade: number, maxPoints: number) => {
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Assignment Management
              </h1>
              <p className="text-gray-600">
                Create, manage, and grade assignments
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <i className="fas fa-plus mr-2"></i>
              Create Assignment
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "assignments", name: "Assignments", icon: "fa-tasks" },
                {
                  id: "grading",
                  name: "Grading Queue",
                  icon: "fa-clipboard-check",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id as "assignments" | "grading")
                  }
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

        {activeTab === "assignments" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    My Assignments
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className={`p-6 cursor-pointer hover:bg-gray-50 ${
                        selectedAssignment?.id === assignment.id
                          ? "bg-primary-50"
                          : ""
                      }`}
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {assignment.course_code} - {assignment.course_name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Due:{" "}
                            {new Date(assignment.due_date).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(assignment.due_date).toLocaleTimeString()}
                          </p>
                          <div className="flex items-center mt-3 space-x-4">
                            <span className="text-sm text-gray-600">
                              <i className="fas fa-users mr-1"></i>
                              {assignment.submission_count} submissions
                            </span>
                            <span className="text-sm text-gray-600">
                              <i className="fas fa-check mr-1"></i>
                              {assignment.graded_count} graded
                            </span>
                            <span className="text-sm text-gray-600">
                              <i className="fas fa-star mr-1"></i>
                              {assignment.max_points} points
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssignmentStatusColor(
                              assignment
                            )}`}
                          >
                            {getAssignmentStatusText(assignment)}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {assignment.assignment_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              {selectedAssignment ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Assignment Details
                    </h2>
                  </div>
                  <div className="p-6">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {selectedAssignment.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {selectedAssignment.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Course</span>
                        <span className="font-medium">
                          {selectedAssignment.course_code}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date</span>
                        <span className="font-medium">
                          {new Date(
                            selectedAssignment.due_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Points</span>
                        <span className="font-medium">
                          {selectedAssignment.max_points}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type</span>
                        <span className="font-medium capitalize">
                          {selectedAssignment.assignment_type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAssignmentStatusColor(
                            selectedAssignment
                          )}`}
                        >
                          {getAssignmentStatusText(selectedAssignment)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Submission Progress
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Submitted</span>
                          <span>{selectedAssignment.submission_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Graded</span>
                          <span>{selectedAssignment.graded_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Pending</span>
                          <span>
                            {selectedAssignment.submission_count -
                              selectedAssignment.graded_count}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("grading")}
                        className="w-full btn btn-primary"
                      >
                        <i className="fas fa-clipboard-check mr-2"></i>
                        Grade Submissions
                      </button>
                      <button type="button" className="w-full btn btn-outline">
                        <i className="fas fa-edit mr-2"></i>
                        Edit Assignment
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center text-gray-500">
                    <i className="fas fa-tasks text-4xl mb-4"></i>
                    <p>Select an assignment to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "grading" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Grading Queue
                {selectedAssignment && ` - ${selectedAssignment.title}`}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.student_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.student_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            submission.is_late
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {submission.is_late ? "Late" : "On Time"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.grade !== undefined ? (
                          <span
                            className={`text-sm font-medium ${getGradeColor(
                              submission.grade,
                              selectedAssignment?.max_points || 100
                            )}`}
                          >
                            {submission.grade}/
                            {selectedAssignment?.max_points || 100}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Not graded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setGradingSubmission(submission)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <i className="fas fa-download"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Assignment
              </h3>
            </div>
            <form onSubmit={handleCreateAssignment} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newAssignment.title}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="e.g., Assignment 1: Data Structures"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    rows={3}
                    placeholder="Brief description of the assignment..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <select
                    value={newAssignment.course_id}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        course_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code}: {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newAssignment.due_date}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          due_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Points
                    </label>
                    <input
                      type="number"
                      value={newAssignment.max_points}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          max_points: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      min="1"
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Type
                  </label>
                  <select
                    value={newAssignment.assignment_type}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        assignment_type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="homework">Homework</option>
                    <option value="project">Project</option>
                    <option value="lab">Lab Assignment</option>
                    <option value="essay">Essay</option>
                    <option value="presentation">Presentation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    value={newAssignment.instructions}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        instructions: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    rows={3}
                    placeholder="Detailed instructions for students..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="publish-immediately"
                    className="mr-2"
                  />
                  <label
                    htmlFor="publish-immediately"
                    className="text-sm text-gray-700"
                  >
                    Publish immediately
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Grade Submission - {gradingSubmission.student_name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade (out of {selectedAssignment?.max_points || 100})
                  </label>
                  <input
                    type="number"
                    value={gradeForm.grade}
                    onChange={(e) =>
                      setGradeForm({ ...gradeForm, grade: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                    max={selectedAssignment?.max_points || 100}
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback
                  </label>
                  <textarea
                    value={gradeForm.feedback}
                    onChange={(e) =>
                      setGradeForm({ ...gradeForm, feedback: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={4}
                    placeholder="Provide feedback to the student..."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setGradingSubmission(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGradeSubmission(gradingSubmission.id)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Save Grade
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
