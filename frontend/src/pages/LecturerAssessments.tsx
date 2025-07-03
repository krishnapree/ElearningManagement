import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Award,
  Calendar,
  Target,
} from "lucide-react";

interface Course {
  id: number;
  name: string;
  code: string;
  enrolled_count: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  course_id: number;
  course_name: string;
  questions_count: number;
  time_limit: number;
  max_attempts: number;
  is_published: boolean;
  created_at: string;
  attempts_count: number;
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
  is_published: boolean;
  submission_count: number;
  graded_count: number;
}

interface QuizQuestion {
  id?: number;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer";
  options: string[];
  correct_answer: string;
  points: number;
}

const LecturerAssessments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"quizzes" | "assignments">(
    "quizzes"
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showQuizDesigner, setShowQuizDesigner] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Quiz form state
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    course_id: "",
    time_limit: 30,
    max_attempts: 3,
    is_published: false,
  });

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    course_id: "",
    due_date: "",
    max_points: 100,
    assignment_type: "homework",
    instructions: "",
    is_published: false,
  });

  // Quiz questions state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    fetchCourses();
    fetchQuizzes();
    fetchAssignments();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/lecturer/courses", {
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
      const response = await fetch("/api/lecturer/quizzes", {
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
      const response = await fetch("/api/lecturer/assignments", {
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

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(quizForm),
      });

      if (response.ok) {
        const data = await response.json();
        setShowQuizModal(false);
        setQuizForm({
          title: "",
          description: "",
          course_id: "",
          time_limit: 30,
          max_attempts: 3,
          is_published: false,
        });
        fetchQuizzes();

        // Open quiz designer for the new quiz
        setEditingQuiz(data.quiz);
        setShowQuizDesigner(true);
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(assignmentForm),
      });

      if (response.ok) {
        setShowAssignmentModal(false);
        setAssignmentForm({
          title: "",
          description: "",
          course_id: "",
          due_date: "",
          max_points: 100,
          assignment_type: "homework",
          instructions: "",
          is_published: false,
        });
        fetchAssignments();
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
    }
  };

  const addQuizQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      {
        question_text: "",
        question_type: "multiple_choice",
        options: ["", "", "", ""],
        correct_answer: "",
        points: 1,
      },
    ]);
  };

  const updateQuizQuestion = (index: number, field: string, value: any) => {
    const updated = [...quizQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setQuizQuestions(updated);
  };

  const removeQuizQuestion = (index: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  const saveQuizQuestions = async () => {
    if (!editingQuiz) return;

    try {
      const response = await fetch(`/api/quizzes/${editingQuiz.id}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ questions: quizQuestions }),
      });

      if (response.ok) {
        setShowQuizDesigner(false);
        setEditingQuiz(null);
        setQuizQuestions([]);
        fetchQuizzes();
      }
    } catch (error) {
      console.error("Error saving quiz questions:", error);
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
            Assessment Management
          </h1>
          <p className="text-gray-600">
            Create and manage quizzes and assignments for your courses
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
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "quizzes" && (
          <div>
            {/* Quiz Actions */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Quizzes</h2>
              <button
                onClick={() => setShowQuizModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Quiz
              </button>
            </div>

            {/* Quiz Grid */}
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingQuiz(quiz);
                          setShowQuizDesigner(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3">
                    {quiz.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2" />
                      {quiz.course_name}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {quiz.time_limit} minutes
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {quiz.attempts_count} attempts
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        quiz.is_published
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {quiz.is_published ? "Published" : "Draft"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {quiz.questions_count} questions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div>
            {/* Assignment Actions */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Assignments
              </h2>
              <button
                onClick={() => setShowAssignmentModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </button>
            </div>

            {/* Assignment Grid */}
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
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3">
                    {assignment.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2" />
                      {assignment.course_code} - {assignment.course_name}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Award className="w-4 h-4 mr-2" />
                      {assignment.max_points} points
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {assignment.submission_count} submissions
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        assignment.is_published
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {assignment.is_published ? "Published" : "Draft"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {assignment.graded_count}/{assignment.submission_count}{" "}
                      graded
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz Creation Modal */}
        {showQuizModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create New Quiz</h3>
              <form onSubmit={handleCreateQuiz}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quiz Title
                    </label>
                    <input
                      type="text"
                      value={quizForm.title}
                      onChange={(e) =>
                        setQuizForm({ ...quizForm, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={quizForm.description}
                      onChange={(e) =>
                        setQuizForm({
                          ...quizForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course
                    </label>
                    <select
                      value={quizForm.course_id}
                      onChange={(e) =>
                        setQuizForm({ ...quizForm, course_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        value={quizForm.time_limit}
                        onChange={(e) =>
                          setQuizForm({
                            ...quizForm,
                            time_limit: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Attempts
                      </label>
                      <input
                        type="number"
                        value={quizForm.max_attempts}
                        onChange={(e) =>
                          setQuizForm({
                            ...quizForm,
                            max_attempts: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="quiz-published"
                      checked={quizForm.is_published}
                      onChange={(e) =>
                        setQuizForm({
                          ...quizForm,
                          is_published: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <label
                      htmlFor="quiz-published"
                      className="text-sm text-gray-700"
                    >
                      Publish immediately
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowQuizModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Quiz
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assignment Creation Modal */}
        {showAssignmentModal && (
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
                      value={assignmentForm.title}
                      onChange={(e) =>
                        setAssignmentForm({
                          ...assignmentForm,
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
                      value={assignmentForm.description}
                      onChange={(e) =>
                        setAssignmentForm({
                          ...assignmentForm,
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
                      value={assignmentForm.course_id}
                      onChange={(e) =>
                        setAssignmentForm({
                          ...assignmentForm,
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
                        value={assignmentForm.due_date}
                        onChange={(e) =>
                          setAssignmentForm({
                            ...assignmentForm,
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
                        value={assignmentForm.max_points}
                        onChange={(e) =>
                          setAssignmentForm({
                            ...assignmentForm,
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
                      value={assignmentForm.assignment_type}
                      onChange={(e) =>
                        setAssignmentForm({
                          ...assignmentForm,
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
                      value={assignmentForm.instructions}
                      onChange={(e) =>
                        setAssignmentForm({
                          ...assignmentForm,
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
                      id="assignment-published"
                      checked={assignmentForm.is_published}
                      onChange={(e) =>
                        setAssignmentForm({
                          ...assignmentForm,
                          is_published: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <label
                      htmlFor="assignment-published"
                      className="text-sm text-gray-700"
                    >
                      Publish immediately
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAssignmentModal(false)}
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
      </div>
    </div>
  );
};

export default LecturerAssessments;
