import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link, useParams } from "react-router-dom";
import CoursePlayer from "../components/CoursePlayer";

interface CourseMaterial {
  id: number;
  title: string;
  description: string;
  file_name: string;
  file_url: string;
  material_type: string;
  thumbnail_url?: string;
  duration?: string;
  uploaded_at: string;
  uploaded_by?: string;
  file_size: number;
  file_type: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  lecturer: string;
  materials: CourseMaterial[];
}

const StudentCoursePlaylist: React.FC = () => {
  const { user } = useAuth();
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'documents' | 'lessons'>('videos');

  useEffect(() => {
    if (courseId) {
      fetchCourseMaterials();
    }
  }, [courseId]);

  const fetchCourseMaterials = async () => {
    try {
      setLoading(true);
      console.log('Fetching course materials for courseId:', courseId);
      const response = await fetch(`/api/courses/${courseId}/materials`, {
        credentials: "include",
      });

      console.log('Course materials response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Course materials data received:', data);
        setCourse(data);
      } else {
        console.error("Failed to fetch course materials:", response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error("Error fetching course materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMaterialIcon = (materialType: string) => {
    switch (materialType) {
      case 'video':
        return 'fas fa-play-circle text-red-500';
      case 'document':
        return 'fas fa-file-alt text-blue-500';
      case 'pdf':
        return 'fas fa-file-pdf text-red-500';
      case 'link':
        return 'fas fa-link text-green-500';
      default:
        return 'fas fa-file text-gray-500';
    }
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return '';
    // Convert seconds to MM:SS format
    const seconds = parseInt(duration);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleMaterialClick = (material: CourseMaterial) => {
    console.log('Material clicked:', material);
    if (material.material_type === 'video') {
      console.log('Setting selected material for video player:', material);
      setSelectedMaterial(material);
    } else {
      // For documents, trigger download
      console.log('Opening document:', material.file_url);
      window.open(material.file_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course materials...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Course not found</p>
          <Link to="/courses" className="mt-4 text-primary-600 hover:text-primary-700">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const videoMaterials = course.materials.filter(m => m.material_type === 'video');
  const documentMaterials = course.materials.filter(m => m.material_type !== 'video');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {course.name}
              </h1>
              <p className="text-gray-600">
                {course.code} • {course.lecturer}
              </p>
            </div>
            <Link
              to="/courses"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Courses
            </Link>
          </div>
        </div>

        {/* Course Description */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Course Description</h2>
          <p className="text-gray-600">{course.description}</p>
        </div>

        {/* Video Player */}
        {selectedMaterial && (
          <div className="mb-8">
            <CoursePlayer
              materials={videoMaterials}
              initialMaterial={selectedMaterial}
              onClose={() => setSelectedMaterial(null)}
            />
          </div>
        )}

        {/* Debug Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Information</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <p>Course ID: {courseId}</p>
            <p>Total materials: {course.materials.length}</p>
            <p>Video materials: {videoMaterials.length}</p>
            <p>Document materials: {documentMaterials.length}</p>
            <p>Selected material: {selectedMaterial ? selectedMaterial.title : 'None'}</p>
            <p>Active tab: {activeTab}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('videos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'videos'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Videos ({videoMaterials.length})
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'documents'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Documents ({documentMaterials.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'videos' && (
              <div className="space-y-4">
                {videoMaterials.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No video materials available</p>
                ) : (
                  videoMaterials.map((material) => (
                    <div
                      key={material.id}
                      onClick={() => handleMaterialClick(material)}
                      className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex-shrink-0 w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                        {material.thumbnail_url ? (
                          <img
                            src={material.thumbnail_url}
                            alt={material.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <i className="fas fa-play text-gray-400"></i>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{material.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {material.description}
                        </p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          {material.duration && (
                            <span>{formatDuration(material.duration)}</span>
                          )}
                          <span>{new Date(material.uploaded_at).toLocaleDateString()}</span>
                          {material.uploaded_by && (
                            <span>by {material.uploaded_by}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <i className="fas fa-play-circle text-primary-600 text-xl"></i>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                {documentMaterials.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No document materials available</p>
                ) : (
                  documentMaterials.map((material) => (
                    <div
                      key={material.id}
                      onClick={() => handleMaterialClick(material)}
                      className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                        <i className={`${getMaterialIcon(material.material_type)} text-xl`}></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{material.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {material.description}
                        </p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <span>{material.file_name}</span>
                          <span>{new Date(material.uploaded_at).toLocaleDateString()}</span>
                          {material.uploaded_by && (
                            <span>by {material.uploaded_by}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <i className="fas fa-download text-primary-600"></i>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCoursePlaylist; 