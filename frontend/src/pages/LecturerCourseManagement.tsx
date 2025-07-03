import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

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

interface CourseMaterial {
  id: number;
  title: string;
  description: string;
  file_name: string;
  file_size: number;
  file_type: string;
  material_type: string;
  uploaded_at: string;
  uploaded_by: string;
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

const LecturerCourseManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'assignments' | 'students'>('overview');
  
  // Material upload state
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    title: "",
    description: "",
    material_type: "document"
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Assignment creation state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    instructions: "",
    max_points: 100,
    assignment_type: "homework",
    due_date: "",
    is_published: true
  });

  // Video upload specific state
  const [videoUploadData, setVideoUploadData] = useState({
    title: "",
    description: "",
    duration: "",
    thumbnail: null as File | null
  });

  useEffect(() => {
    fetchLecturerCourses();
  }, []);

  const fetchLecturerCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/lecturer/courses", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Failed to fetch lecturer courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseMaterials = async (courseId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/materials`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error("Failed to fetch course materials:", error);
    }
  };

  const fetchCourseAssignments = async (courseId: number) => {
    try {
      const response = await fetch(`/api/assignments?course_id=${courseId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Failed to fetch course assignments:", error);
    }
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    if (activeTab === 'materials') {
      fetchCourseMaterials(course.id);
    } else if (activeTab === 'assignments') {
      fetchCourseAssignments(course.id);
    }
  };

  const handleTabChange = (tab: 'overview' | 'materials' | 'assignments' | 'students') => {
    setActiveTab(tab);
    if (selectedCourse) {
      if (tab === 'materials') {
        fetchCourseMaterials(selectedCourse.id);
      } else if (tab === 'assignments') {
        fetchCourseAssignments(selectedCourse.id);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-detect material type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
        setMaterialForm(prev => ({ ...prev, material_type: 'video' }));
      } else if (['pdf', 'doc', 'docx'].includes(extension || '')) {
        setMaterialForm(prev => ({ ...prev, material_type: 'document' }));
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
        setMaterialForm(prev => ({ ...prev, material_type: 'image' }));
      }
    }
  };

  const handleMaterialUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedFile) return;

    try {
      setUploadingMaterial(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', materialForm.title);
      formData.append('description', materialForm.description);
      formData.append('material_type', materialForm.material_type);

      // Add video-specific data if it's a video
      if (materialForm.material_type === 'video') {
        formData.append('duration', videoUploadData.duration);
        if (videoUploadData.thumbnail) {
          formData.append('thumbnail', videoUploadData.thumbnail);
        }
      }

      const response = await fetch(`/api/courses/${selectedCourse.id}/materials`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        setShowMaterialModal(false);
        setMaterialForm({ title: "", description: "", material_type: "document" });
        setSelectedFile(null);
        setVideoUploadData({ title: "", description: "", duration: "", thumbnail: null });
        setUploadProgress(0);
        
        // Refresh materials
        await fetchCourseMaterials(selectedCourse.id);
        alert('Material uploaded successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to upload material');
      }
    } catch (error) {
      console.error('Error uploading material:', error);
      alert('Failed to upload material');
    } finally {
      setUploadingMaterial(false);
      setUploadProgress(0);
    }
  };

  const simulateUploadProgress = () => {
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    setCreatingAssignment(true);
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...assignmentForm,
          course_id: selectedCourse.id
        }),
      });

      if (response.ok) {
        setShowAssignmentModal(false);
        setAssignmentForm({
          title: "",
          description: "",
          instructions: "",
          max_points: 100,
          assignment_type: "homework",
          due_date: "",
          is_published: true
        });
        fetchCourseAssignments(selectedCourse.id);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to create assignment");
      }
    } catch (error) {
      console.error("Failed to create assignment:", error);
      alert("Failed to create assignment");
    } finally {
      setCreatingAssignment(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">Manage your courses, materials, and assignments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Course List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Your Courses</h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => handleCourseSelect(course)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedCourse?.id === course.id
                          ? "bg-primary-50 border border-primary-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-gray-900">{course.code}</div>
                      <div className="text-sm text-gray-600">{course.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {course.enrolled_count} students enrolled
                      </div>
                    </button>
                  ))}
                </div>
                {courses.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No courses assigned yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedCourse ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Course Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedCourse.code} - {selectedCourse.name}
                      </h2>
                      <p className="text-gray-600">
                        {selectedCourse.department} • {selectedCourse.credits} credits
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Enrolled Students</div>
                      <div className="text-2xl font-bold text-primary-600">
                        {selectedCourse.enrolled_count}/{selectedCourse.max_capacity}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { key: 'overview', label: 'Overview', icon: 'fa-chart-line' },
                      { key: 'materials', label: 'Materials', icon: 'fa-file-alt' },
                      { key: 'assignments', label: 'Assignments', icon: 'fa-tasks' },
                      { key: 'students', label: 'Students', icon: 'fa-users' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key as any)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.key
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <i className={`fas ${tab.icon} mr-2`}></i>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <i className="fas fa-file-alt text-blue-600"></i>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-blue-600">Course Materials</p>
                              <p className="text-2xl font-bold text-blue-900">{materials.length}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <i className="fas fa-tasks text-green-600"></i>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-600">Assignments</p>
                              <p className="text-2xl font-bold text-green-900">{assignments.length}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <i className="fas fa-users text-purple-600"></i>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-purple-600">Students</p>
                              <p className="text-2xl font-bold text-purple-900">{selectedCourse.enrolled_count}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Course Description</h3>
                        <p className="text-gray-600">
                          {selectedCourse.description || "No description available."}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'materials' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Course Materials</h3>
                        <button
                          onClick={() => setShowMaterialModal(true)}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <i className="fas fa-upload mr-2"></i>
                          Upload Material
                        </button>
                      </div>

                      <div className="space-y-4">
                        {materials.map((material) => (
                          <div key={material.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                  <i className="fas fa-file text-gray-600"></i>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{material.title}</h4>
                                  <p className="text-sm text-gray-600">{material.description}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(material.file_size)} • {material.material_type}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button className="text-blue-600 hover:text-blue-800">
                                  <i className="fas fa-download"></i>
                                </button>
                                <button className="text-red-600 hover:text-red-800">
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {materials.length === 0 && (
                          <p className="text-gray-500 text-center py-8">
                            No materials uploaded yet. Upload your first material to get started.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'assignments' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Assignments</h3>
                        <button
                          onClick={() => setShowAssignmentModal(true)}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <i className="fas fa-plus mr-2"></i>
                          Create Assignment
                        </button>
                      </div>

                      <div className="space-y-4">
                        {assignments.map((assignment) => (
                          <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                                <p className="text-sm text-gray-600">{assignment.description}</p>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                  <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                  <span>Max Points: {assignment.max_points}</span>
                                  <span>Submissions: {assignment.submission_count}</span>
                                  <span>Graded: {assignment.graded_count}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  assignment.is_published
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {assignment.is_published ? "Published" : "Draft"}
                                </span>
                                <button className="text-blue-600 hover:text-blue-800">
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button className="text-red-600 hover:text-red-800">
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {assignments.length === 0 && (
                          <p className="text-gray-500 text-center py-8">
                            No assignments created yet. Create your first assignment to get started.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'students' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Enrolled Students</h3>
                      <p className="text-gray-500 text-center py-8">
                        Student list functionality will be implemented here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">
                    <i className="fas fa-book-open"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Course
                  </h3>
                  <p className="text-gray-600">
                    Choose a course from the sidebar to view its details and manage content.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Material Upload Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Upload Course Material
                </h3>
                <button
                  onClick={() => {
                    setShowMaterialModal(false);
                    setMaterialForm({ title: "", description: "", material_type: "document" });
                    setSelectedFile(null);
                    setVideoUploadData({ title: "", description: "", duration: "", thumbnail: null });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleMaterialUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Type
                  </label>
                  <select
                    value={materialForm.material_type}
                    onChange={(e) => setMaterialForm({...materialForm, material_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="document">Document</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={materialForm.description}
                    onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    accept={
                      materialForm.material_type === 'video' 
                        ? 'video/*' 
                        : materialForm.material_type === 'image'
                        ? 'image/*'
                        : materialForm.material_type === 'audio'
                        ? 'audio/*'
                        : '.pdf,.doc,.docx,.txt,.ppt,.pptx'
                    }
                    required
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {/* Video-specific fields */}
                {materialForm.material_type === 'video' && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Video Details</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Duration (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 15:30"
                        value={videoUploadData.duration}
                        onChange={(e) => setVideoUploadData({...videoUploadData, duration: e.target.value})}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Thumbnail (optional)
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setVideoUploadData({...videoUploadData, thumbnail: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        accept="image/*"
                      />
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {uploadingMaterial && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMaterialModal(false);
                      setMaterialForm({ title: "", description: "", material_type: "document" });
                      setSelectedFile(null);
                      setVideoUploadData({ title: "", description: "", duration: "", thumbnail: null });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingMaterial || !selectedFile}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {uploadingMaterial ? (
                      <span>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Uploading...
                      </span>
                    ) : (
                      'Upload Material'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Creation Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Assignment</h3>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    value={assignmentForm.instructions}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Points
                    </label>
                    <input
                      type="number"
                      value={assignmentForm.max_points}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, max_points: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={assignmentForm.assignment_type}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, assignment_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="homework">Homework</option>
                      <option value="quiz">Quiz</option>
                      <option value="project">Project</option>
                      <option value="exam">Exam</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={assignmentForm.due_date}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={assignmentForm.is_published}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, is_published: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Publish immediately
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignmentModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAssignment}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {creatingAssignment ? "Creating..." : "Create Assignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerCourseManagement;
