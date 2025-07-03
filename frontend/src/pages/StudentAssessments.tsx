import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Award,
  Calendar,
  Target,
  Play,
  Upload,
  Eye,
  Download,
  Timer,
  TrendingUp,
} from "lucide-react";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  course_id: number;
  course_name: string;
  course_code: string;
  time_limit: number;
  max_attempts: number;
  is_published: boolean;
  questions_count: number;
  my_attempts: number;
  best_score: number | null;
  last_attempt_date: string | null;
  status: "available" | "completed" | "in_progress" | "expired";
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  course_id: number;
  course_name: string;
  course_code: string;
  due_date: string;
  max_points: number;
  assignment_type: string;
  instructions: string;
  is_published: boolean;
  my_submission: {
    id: number;
    submitted_at: string;
    grade: number | null;
    feedback: string | null;
    file_path: string | null;
  } | null;
  status: "pending" | "submitted" | "graded" | "overdue";
}

interface QuizAttempt {
  id: number;
  attempt_number: number;
  score: number;
  total_points: number;
  completed_at: string;
  time_taken: number;
}

const StudentAssessments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "quizzes" | "assignments" | "grades"
  >("quizzes");
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    fetchCourses();
    fetchQuizzes();
    fetchAssignments();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/student/courses", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/student/quizzes", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/student/assignments", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const startQuiz = async (quizId: number) => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/start`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // Redirect to quiz taking interface
        window.location.href = `/quiz-attempt/${data.attempt_id}`;
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
    }
  };

  const fetchQuizAttempts = async (quizId: number) => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/my-attempts`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setQuizAttempts(data.attempts);
      }
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "completed":
      case "submitted":
        return "bg-green-100 text-green-800";
      case "graded":
        return "bg-purple-100 text-purple-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "completed":
      case "submitted":
        return <CheckCircle className="w-4 h-4" />;
      case "graded":
        return <Award className="w-4 h-4" />;
      case "in_progress":
        return <Timer className="w-4 h-4" />;
      case "expired":
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredQuizzes = selectedCourse
    ? quizzes.filter((quiz) => quiz.course_id === selectedCourse)
    : quizzes;

  const filteredAssignments = selectedCourse
    ? assignments.filter(
        (assignment) => assignment.course_id === selectedCourse
      )
    : assignments;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Assessments
          </h1>
          <p className="text-gray-600">
            Access quizzes, submit assignments, and view your grades
          </p>
        </div>

        {/* Course Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Course
          </label>
          <select
            value={selectedCourse || ""}
            onChange={(e) =>
              setSelectedCourse(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("quizzes")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "quizzes"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Quizzes
                </div>
              </button>
              <button
                onClick={() => setActiveTab("assignments")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "assignments"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Assignments
                </div>
              </button>
              <button
                onClick={() => setActiveTab("grades")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "grades"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Grades
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "quizzes" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Available Quizzes
            </h2>

            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Quizzes Available
                </h3>
                <p className="text-gray-600">
                  No quizzes have been published for your courses yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {quiz.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs flex items-center ${getStatusColor(
                          quiz.status
                        )}`}
                      >
                        {getStatusIcon(quiz.status)}
                        <span className="ml-1 capitalize">{quiz.status}</span>
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">
                      {quiz.description}
                    </p>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center text-gray-600">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {quiz.course_code} - {quiz.course_name}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {quiz.time_limit} minutes
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Target className="w-4 h-4 mr-2" />
                        {quiz.questions_count} questions
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Award className="w-4 h-4 mr-2" />
                        Attempts: {quiz.my_attempts}/{quiz.max_attempts}
                      </div>
                      {quiz.best_score !== null && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Best Score: {quiz.best_score}%
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {quiz.status === "available" &&
                        quiz.my_attempts < quiz.max_attempts && (
                          <button
                            onClick={() => startQuiz(quiz.id)}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Quiz
                          </button>
                        )}
                      <button
                        onClick={() => {
                          setSelectedQuiz(quiz);
                          fetchQuizAttempts(quiz.id);
                          setShowQuizModal(true);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "assignments" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              My Assignments
            </h2>

            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Assignments Available
                </h3>
                <p className="text-gray-600">
                  No assignments have been published for your courses yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assignment.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs flex items-center ${getStatusColor(
                          assignment.status
                        )}`}
                      >
                        {getStatusIcon(assignment.status)}
                        <span className="ml-1 capitalize">
                          {assignment.status}
                        </span>
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">
                      {assignment.description}
                    </p>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center text-gray-600">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {assignment.course_code} - {assignment.course_name}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Due:{" "}
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Award className="w-4 h-4 mr-2" />
                        {assignment.max_points} points
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FileText className="w-4 h-4 mr-2" />
                        Type: {assignment.assignment_type}
                      </div>
                      {assignment.my_submission &&
                        assignment.my_submission.grade !== null && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Grade: {assignment.my_submission.grade}/
                            {assignment.max_points}
                          </div>
                        )}
                    </div>

                    <div className="flex space-x-2">
                      {assignment.status === "pending" && (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowAssignmentModal(true);
                          }}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Submit
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowAssignmentModal(true);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "grades" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              My Grades
            </h2>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Grade Summary
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assessment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Quiz grades */}
                    {filteredQuizzes
                      .filter((quiz) => quiz.best_score !== null)
                      .map((quiz) => (
                        <tr key={`quiz-${quiz.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Target className="w-5 h-5 text-blue-500 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {quiz.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Quiz
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {quiz.course_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Quiz
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={`font-medium ${
                                quiz.best_score! >= 80
                                  ? "text-green-600"
                                  : quiz.best_score! >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {quiz.best_score}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {quiz.last_attempt_date
                              ? new Date(
                                  quiz.last_attempt_date
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}

                    {/* Assignment grades */}
                    {filteredAssignments
                      .filter(
                        (assignment) => assignment.my_submission?.grade !== null
                      )
                      .map((assignment) => (
                        <tr key={`assignment-${assignment.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-green-500 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {assignment.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Assignment
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {assignment.course_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {assignment.assignment_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={`font-medium ${
                                assignment.my_submission!.grade! /
                                  assignment.max_points >=
                                0.8
                                  ? "text-green-600"
                                  : assignment.my_submission!.grade! /
                                      assignment.max_points >=
                                    0.6
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {assignment.my_submission!.grade}/
                              {assignment.max_points}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {assignment.my_submission?.submitted_at
                              ? new Date(
                                  assignment.my_submission.submitted_at
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              Graded
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {filteredQuizzes.filter((quiz) => quiz.best_score !== null)
                .length === 0 &&
                filteredAssignments.filter(
                  (assignment) => assignment.my_submission?.grade !== null
                ).length === 0 && (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Grades Available
                    </h3>
                    <p className="text-gray-600">
                      Complete assessments to see your grades here.
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Quiz Details Modal */}
        {showQuizModal && selectedQuiz && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedQuiz.title}
                  </h3>
                  <button
                    onClick={() => setShowQuizModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>✕
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600">{selectedQuiz.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Course:</span>{" "}
                      {selectedQuiz.course_name}
                    </div>
                    <div>
                      <span className="font-medium">Time Limit:</span>{" "}
                      {selectedQuiz.time_limit} minutes
                    </div>
                    <div>
                      <span className="font-medium">Questions:</span>{" "}
                      {selectedQuiz.questions_count}
                    </div>
                    <div>
                      <span className="font-medium">Max Attempts:</span>{" "}
                      {selectedQuiz.max_attempts}
                    </div>
                  </div>

                  {quizAttempts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Your Attempts
                      </h4>
                      <div className="space-y-2">
                        {quizAttempts.map((attempt) => (
                          <div
                            key={attempt.id}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded"
                          >
                            <div>
                              <span className="font-medium">
                                Attempt {attempt.attempt_number}
                              </span>
                              <span className="text-gray-600 ml-2">
                                {new Date(
                                  attempt.completed_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {attempt.score}/{attempt.total_points}
                              </div>
                              <div className="text-sm text-gray-600">
                                {Math.round(attempt.time_taken / 60)} min
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowQuizModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    {selectedQuiz.status === "available" &&
                      selectedQuiz.my_attempts < selectedQuiz.max_attempts && (
                        <button
                          onClick={() => {
                            setShowQuizModal(false);
                            startQuiz(selectedQuiz.id);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Start Quiz
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Details Modal */}
        {showAssignmentModal && selectedAssignment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedAssignment.title}
                  </h3>
                  <button
                    onClick={() => setShowAssignmentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>✕
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600">
                    {selectedAssignment.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Course:</span>{" "}
                      {selectedAssignment.course_name}
                    </div>
                    <div>
                      <span className="font-medium">Due Date:</span>{" "}
                      {new Date(
                        selectedAssignment.due_date
                      ).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {selectedAssignment.assignment_type}
                    </div>
                    <div>
                      <span className="font-medium">Max Points:</span>{" "}
                      {selectedAssignment.max_points}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Instructions
                    </h4>
                    <div className="p-3 bg-gray-50 rounded text-sm">
                      {selectedAssignment.instructions}
                    </div>
                  </div>

                  {selectedAssignment.my_submission && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Your Submission
                      </h4>
                      <div className="p-3 bg-green-50 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">
                            Submitted:{" "}
                            {new Date(
                              selectedAssignment.my_submission.submitted_at
                            ).toLocaleDateString()}
                          </span>
                          {selectedAssignment.my_submission.grade !== null && (
                            <span className="font-medium text-green-600">
                              Grade: {selectedAssignment.my_submission.grade}/
                              {selectedAssignment.max_points}
                            </span>
                          )}
                        </div>
                        {selectedAssignment.my_submission.feedback && (
                          <div className="mt-2">
                            <span className="font-medium">Feedback:</span>
                            <p className="text-sm mt-1">
                              {selectedAssignment.my_submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setShowAssignmentModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    {selectedAssignment.status === "pending" && (
                      <button
                        onClick={() => {
                          // Handle assignment submission
                          console.log("Submit assignment");
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Submit Assignment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssessments;
