import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
}

interface UploadedMaterial {
  id: number;
  title: string;
  description: string;
  file_name: string;
  material_type: string;
  upload_date: string;
  file_size?: number;
}

const LecturerUploadMaterials: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [materials, setMaterials] = useState<UploadedMaterial[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState("document");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
      fetchCourseMaterials();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseMaterials = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/materials`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error("Error fetching course materials:", error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-detect material type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm', 'ogg'].includes(extension || '')) {
        setMaterialType('video');
      } else if (['pdf'].includes(extension || '')) {
        setMaterialType('pdf');
      } else if (['doc', 'docx'].includes(extension || '')) {
        setMaterialType('document');
      } else {
        setMaterialType('document');
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !title.trim()) {
      alert("Please select a file and provide a title");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("material_type", materialType);

    try {
      const response = await fetch(`/api/courses/${courseId}/materials`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        alert("Material uploaded successfully!");
        
        // Reset form
        setTitle("");
        setDescription("");
        setSelectedFile(null);
        setMaterialType("document");
        setUploadProgress(0);
        
        // Refresh materials list
        fetchCourseMaterials();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm("Are you sure you want to delete this material?")) {
      return;
    }

    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        alert("Material deleted successfully!");
        fetchCourseMaterials();
      } else {
        alert("Failed to delete material");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete material");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Upload Course Materials
              </h1>
              <p className="text-gray-600">
                {course.name} ({course.code})
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upload New Material
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manage'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manage Materials ({materials.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'upload' && (
              <div className="max-w-2xl">
                <form onSubmit={handleUpload} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Material Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter material title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter material description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Material Type
                    </label>
                    <select
                      value={materialType}
                      onChange={(e) => setMaterialType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="document">Document</option>
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="link">Link</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.mp4,.avi,.mov,.mkv,.flv,.wmv,.webm,.ogg"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="text-gray-400 text-6xl mb-4">
                          <i className="fas fa-cloud-upload-alt"></i>
                        </div>
                        <p className="text-gray-600 mb-2">
                          Click to select a file or drag and drop
                        </p>
                        <p className="text-sm text-gray-500">
                          Supported formats: PDF, DOC, DOCX, MP4, AVI, MOV, MKV, FLV, WMV, WEBM, OGG
                        </p>
                      </label>
                    </div>
                    {selectedFile && (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      </div>
                    )}
                  </div>

                  {uploading && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">Uploading...</span>
                        <span className="text-sm text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setTitle("");
                        setDescription("");
                        setSelectedFile(null);
                        setMaterialType("document");
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Clear Form
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || !selectedFile || !title.trim()}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? "Uploading..." : "Upload Material"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'manage' && (
              <div className="space-y-4">
                {materials.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No materials uploaded yet</p>
                ) : (
                  materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                          <i className={`${getMaterialIcon(material.material_type)} text-xl`}></i>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{material.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {material.description}
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                            <span>{material.file_name}</span>
                            {material.file_size && (
                              <span>{formatFileSize(material.file_size)}</span>
                            )}
                            <span>{new Date(material.upload_date).toLocaleDateString()}</span>
                            <span className="capitalize">{material.material_type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete material"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
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

export default LecturerUploadMaterials; 