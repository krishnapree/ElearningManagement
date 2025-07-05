import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
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
  course_content?: CourseContent;
}

interface CourseContent {
  overview: string;
  learning_objectives: string[];
  course_outline: CourseSection[];
  assessment_methods: string[];
  resources: string[];
  policies: string[];
  contact_info: string;
  office_hours: string;
  announcements: CourseAnnouncement[];
}

interface CourseSection {
  title: string;
  description: string;
  topics: string[];
  duration: string;
  materials: string[];
}

interface CourseAnnouncement {
  id: number;
  title: string;
  content: string;
  date: string;
  is_important: boolean;
}

const CourseDetails: React.FC = () => {
  const { user: _user } = useAuth();
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "syllabus"
    | "materials"
    | "assignments"
    | "announcements"
    | "content"
  >("overview");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Content editing state
  const [editContent, setEditContent] = useState<CourseContent>({
    overview: "",
    learning_objectives: [""],
    course_outline: [],
    assessment_methods: [""],
    resources: [""],
    policies: [""],
    contact_info: "",
    office_hours: "",
    announcements: []
  });

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        if (data.course.course_content) {
          setEditContent(data.course.course_content);
        }
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ course_content: editContent }),
      });

      if (response.ok) {
        setIsEditing(false);
        fetchCourseData(); // Refresh data
      }
    } catch (error) {
      console.error("Error saving content:", error);
    }
  };

  const addLearningObjective = () => {
    setEditContent(prev => ({
      ...prev,
      learning_objectives: [...prev.learning_objectives, ""]
    }));
  };

  const updateLearningObjective = (index: number, value: string) => {
    setEditContent(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.map((obj, i) => 
        i === index ? value : obj
      )
    }));
  };

  const removeLearningObjective = (index: number) => {
    setEditContent(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
          <p className="text-gray-600">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
                <p className="text-lg text-gray-600 mt-1">{course.code}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {course.department_name} • {course.semester_name}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {_user?.role === "admin" && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {isEditing ? "Cancel Edit" : "Edit Content"}
                  </button>
                )}
                <Link
                  to="/courses"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: "overview", label: "Overview", icon: "fas fa-info-circle" },
              { key: "syllabus", label: "Syllabus", icon: "fas fa-book" },
              { key: "materials", label: "Materials", icon: "fas fa-file-alt" },
              { key: "assignments", label: "Assignments", icon: "fas fa-tasks" },
              { key: "announcements", label: "Announcements", icon: "fas fa-bullhorn" },
              ...( _user?.role === "admin" ? [{ key: "content", label: "Content Management", icon: "fas fa-edit" }] : [])
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Description */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Description
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {course.description || "No description available."}
                </p>
              </div>

              {/* Learning Objectives */}
              {course.course_content?.learning_objectives && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Learning Objectives
                  </h3>
                  <ul className="space-y-2">
                    {course.course_content.learning_objectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <span className="text-gray-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Assessment Methods */}
              {course.course_content?.assessment_methods && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Assessment Methods
                  </h3>
                  <ul className="space-y-2">
                    {course.course_content.assessment_methods.map((method, index) => (
                      <li key={index} className="flex items-start">
                        <i className="fas fa-clipboard-check text-blue-500 mt-1 mr-3"></i>
                        <span className="text-gray-700">{method}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credits:</span>
                    <span className="font-medium">{course.credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enrollment:</span>
                    <span className="font-medium">
                      {course.enrolled_count}/{course.max_capacity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lecturer:</span>
                    <span className="font-medium">{course.lecturer_name || "TBA"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      course.is_active ? "text-green-600" : "text-red-600"
                    }`}>
                      {course.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              {course.course_content?.contact_info && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-700">{course.course_content.contact_info}</p>
                    </div>
                    {course.course_content.office_hours && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Office Hours:</h4>
                        <p className="text-gray-700">{course.course_content.office_hours}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "content" && _user?.role === "admin" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Course Content Management
              </h3>
              {isEditing && (
                <button
                  onClick={handleSaveContent}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Overview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Overview
                </label>
                <textarea
                  value={editContent.overview}
                  onChange={(e) => setEditContent(prev => ({ ...prev, overview: e.target.value }))}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  placeholder="Enter course overview..."
                />
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Objectives
                </label>
                {editContent.learning_objectives.map((objective, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => updateLearningObjective(index, e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                      placeholder="Enter learning objective..."
                    />
                    {isEditing && (
                      <button
                        onClick={() => removeLearningObjective(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={addLearningObjective}
                    className="text-primary-600 hover:text-primary-800 text-sm"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Add Learning Objective
                  </button>
                )}
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Information
                </label>
                <textarea
                  value={editContent.contact_info}
                  onChange={(e) => setEditContent(prev => ({ ...prev, contact_info: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  placeholder="Enter contact information..."
                />
              </div>

              {/* Office Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Hours
                </label>
                <input
                  type="text"
                  value={editContent.office_hours}
                  onChange={(e) => setEditContent(prev => ({ ...prev, office_hours: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  placeholder="e.g., Monday 2-4 PM, Wednesday 10-12 AM"
                />
              </div>
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab === "syllabus" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Syllabus</h3>
            <p className="text-gray-600">Syllabus content will be displayed here.</p>
          </div>
        )}

        {activeTab === "materials" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Materials</h3>
            <p className="text-gray-600">Course materials will be displayed here.</p>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignments</h3>
            <p className="text-gray-600">Assignments will be displayed here.</p>
          </div>
        )}

        {activeTab === "announcements" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Announcements</h3>
            <p className="text-gray-600">Course announcements will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails; 