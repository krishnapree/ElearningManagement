import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import CoursePlayer from '../components/CoursePlayer'

interface Course {
  id: number
  name: string
  code: string
  lecturer: string
  materials_count: number
}

interface Material {
  id: number
  title: string
  description: string
  material_type: string
  file_url: string
  thumbnail_url?: string
  duration?: string
  file_size: number
  uploaded_at: string
  file_name: string
  file_type: string
  uploaded_by: string
}

interface Lesson {
  id: number
  title: string
  description: string
  content: string
  duration: number
  is_completed: boolean
  created_at: string
}

const StudentCourseMaterials: React.FC = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'materials' | 'lessons' | 'videos'>('materials')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchMaterials()
      fetchLessons()
    }
  }, [selectedCourse])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/enrolled-courses', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Courses data received:', data)
        setCourses(data.courses || [])
        if (data.courses.length > 0 && !selectedCourse) {
          setSelectedCourse(data.courses[0].id)
        }
      } else {
        console.error('Failed to fetch courses:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterials = async () => {
    if (!selectedCourse) return

    try {
      console.log('Fetching materials for course:', selectedCourse)
      const response = await fetch(`/api/courses/${selectedCourse}/materials`, {
        credentials: 'include'
      })
      
      console.log('Materials response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Materials data received:', data)
        setMaterials(data.materials || [])
      } else {
        console.error('Failed to fetch materials:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const fetchLessons = async () => {
    if (!selectedCourse) return

    try {
      const response = await fetch(`/api/courses/${selectedCourse}/lessons`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setLessons(data.lessons || [])
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
    }
  }

  const handleVideoComplete = async (materialId: number) => {
    // Mark video as completed (if tracking is needed)
    console.log('Video completed:', materialId)
  }

  const selectedCourseData = courses.find(c => c.id === selectedCourse)
  const videoMaterials = materials.filter(m => m.material_type === 'video')
  const documentMaterials = materials.filter(m => m.material_type !== 'video')

  const filteredMaterials = documentMaterials.filter(material => {
    if (searchTerm && !material.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterType !== 'all' && material.material_type !== filterType) return false
    return true
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'document': return 'fas fa-file-alt text-blue-500'
      case 'video': return 'fas fa-video text-red-500'
      case 'pdf': return 'fas fa-file-pdf text-red-500'
      case 'image': return 'fas fa-image text-green-500'
      case 'audio': return 'fas fa-music text-purple-500'
      case 'presentation': return 'fas fa-presentation text-orange-500'
      default: return 'fas fa-file text-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course materials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Materials</h1>
          <p className="text-gray-600">Access learning materials and track lesson progress</p>
        </div>

        {/* Course Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Course</h3>
              <div className="flex flex-wrap gap-2">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCourse === course.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {course.code}: {course.name}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedCourseData && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Instructor</p>
                <p className="font-medium text-gray-900">{selectedCourseData.lecturer}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedCourseData.materials_count} materials available
                </p>
              </div>
            )}
          </div>
        </div>

        {selectedCourse && (
          <>
            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'materials'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <i className="fas fa-file-alt mr-2"></i>
                    Documents ({documentMaterials.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'videos'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <i className="fas fa-video mr-2"></i>
                    Videos ({videoMaterials.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('lessons')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'lessons'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <i className="fas fa-book mr-2"></i>
                    Lessons ({lessons.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'materials' && (
              <div>
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search materials..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">All Types</option>
                        <option value="document">Documents</option>
                        <option value="presentation">Presentations</option>
                        <option value="image">Images</option>
                        <option value="audio">Audio</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Materials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMaterials.map((material) => (
                    <div key={material.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                              <i className={getMaterialIcon(material.material_type)}></i>
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {material.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {material.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 space-x-4">
                              <span>
                                <i className="fas fa-file mr-1"></i>
                                {formatFileSize(material.file_size)}
                              </span>
                              <span>
                                <i className="fas fa-calendar mr-1"></i>
                                {new Date(material.uploaded_at).toLocaleDateString()}
                              </span>
                              <span>
                                <i className="fas fa-user mr-1"></i>
                                {material.uploaded_by}
                              </span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={material.file_url}
                          target={material.material_type === 'video' ? '_blank' : undefined}
                          download={material.material_type !== 'video'}
                          className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-center block"
                        >
                          <i className={`${material.material_type === 'video' ? 'fas fa-play' : 'fas fa-download'} mr-2`}></i>
                          {material.material_type === 'video' ? 'Watch Video' : 'Download'}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredMaterials.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No materials found
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm || filterType !== 'all' 
                        ? 'Try adjusting your search or filters.'
                        : 'No materials have been uploaded for this course yet.'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'videos' && (
              <div>
                <CoursePlayer 
                  materials={videoMaterials}
                  onVideoComplete={handleVideoComplete}
                />
              </div>
            )}

            {activeTab === 'lessons' && (
              <div>
                <div className="grid gap-6">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {lesson.title}
                            </h3>
                            {lesson.is_completed && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <i className="fas fa-check mr-1"></i>
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{lesson.description}</p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span>
                              <i className="fas fa-clock mr-1"></i>
                              {lesson.duration} minutes
                            </span>
                            <span>
                              <i className="fas fa-calendar mr-1"></i>
                              {new Date(lesson.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {/* Handle lesson completion */}}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            lesson.is_completed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          {lesson.is_completed ? 'Completed' : 'Mark Complete'}
                        </button>
                      </div>
                      
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="prose prose-sm max-w-none">
                          {lesson.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {lessons.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">
                      <i className="fas fa-book"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No lessons available
                    </h3>
                    <p className="text-gray-600">
                      No lessons have been created for this course yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {selectedCourse && materials.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              <i className="fas fa-folder-open"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Materials Available
            </h3>
            <p className="text-gray-600">
              No materials have been uploaded for this course yet. Check back later or contact your instructor.
            </p>
          </div>
        )}

        {!selectedCourse && courses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Enrolled Courses
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't enrolled in any courses yet. Enroll in courses to access their materials.
            </p>
            <div className="space-x-4">
              <a
                href="/courses"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <i className="fas fa-search mr-2"></i>
                Browse Courses
              </a>
              <a
                href="/student-enrollments"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i className="fas fa-list mr-2"></i>
                My Enrollments
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentCourseMaterials
