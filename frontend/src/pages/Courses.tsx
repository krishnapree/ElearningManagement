import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'

interface Course {
  id: number
  name: string
  code: string
  description: string
  credits: number
  department_name: string
  lecturer_name: string
  semester_name: string
  max_capacity: number
  enrolled_count: number
  available_spots: number
  is_active: boolean
}

interface Program {
  id: number
  name: string
  code: string
  department: string
  duration: number
  total_credits: number
}

const Courses: React.FC = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState<number | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    department: "",
    credits: "",
    availability: ""
  })

  useEffect(() => {
    fetchCourses()
    fetchPrograms()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/academic/courses', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      } else {
        setError('Failed to fetch courses')
      }
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/academic/programs', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
        // Auto-select first program if available
        if (data.programs && data.programs.length > 0) {
          setSelectedProgram(data.programs[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching programs:', err)
    }
  }

  const handleEnroll = async (courseId: number) => {
    if (!selectedProgram) {
      alert('Please select a program first')
      return
    }

    try {
      setEnrolling(courseId)
      
      const response = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          course_id: courseId,
          program_id: selectedProgram
        })
      })

      if (response.ok) {
        // Refresh courses to update enrollment counts
        await fetchCourses()
        alert('Successfully enrolled in course!')
      } else {
        const errorData = await response.json()
        alert(errorData.detail || 'Failed to enroll in course')
      }
    } catch (error) {
      console.error('Error enrolling in course:', error)
      alert('Failed to enroll in course')
    } finally {
      setEnrolling(null)
    }
  }

  const filteredCourses = courses.filter(course => {
    if (filters.department && course.department_name !== filters.department) return false
    if (filters.credits && course.credits !== parseInt(filters.credits)) return false
    if (filters.availability === 'available' && course.available_spots <= 0) return false
    if (filters.availability === 'waitlist' && course.available_spots > 0) return false
    return true
  })

  const getDepartments = () => {
    const departments = [...new Set(courses.map(course => course.department_name))]
    return departments.sort()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
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
            onClick={fetchCourses}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Courses
          </h1>
          <p className="text-gray-600">
            {user?.role === 'student' 
              ? 'Discover and enroll in courses for the current semester'
              : 'View all available courses in the system'
            }
          </p>
        </div>

        {/* Program Selection - Only for Students */}
        {user?.role === 'student' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Your Program</h3>
              <p className="text-sm text-gray-600">Choose the program you want to enroll in courses for</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((program) => (
                <button
                  key={program.id}
                  onClick={() => setSelectedProgram(program.id)}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${
                    selectedProgram === program.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{program.name}</div>
                  <div className="text-sm text-gray-600">{program.code}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {program.duration} years • {program.total_credits} credits
                  </div>
                </button>
              ))}
            </div>
            {programs.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No programs available. Please contact your administrator.
              </p>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
              >
                <option value="">All Departments</option>
                {getDepartments().map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credits
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.credits}
                onChange={(e) => setFilters({...filters, credits: e.target.value})}
              >
                <option value="">Any Credits</option>
                <option value="3">3 Credits</option>
                <option value="4">4 Credits</option>
              </select>
            </div>
            {user?.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters.availability}
                  onChange={(e) => setFilters({...filters, availability: e.target.value})}
                >
                  <option value="">All Courses</option>
                  <option value="available">Available</option>
                  <option value="waitlist">Waitlist</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {course.name}
                    </h3>
                    <p className="text-sm text-gray-500">{course.code}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {course.credits} Credits
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-building mr-2"></i>
                    {course.department_name}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-chalkboard-teacher mr-2"></i>
                    {course.lecturer_name}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-calendar mr-2"></i>
                    {course.semester_name}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{course.enrolled_count}</span> / {course.max_capacity} enrolled
                  </div>
                  {user?.role === 'student' ? (
                    <div className={`text-sm font-medium ${
                      course.available_spots > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {course.available_spots > 0 ? `${course.available_spots} spots available` : 'Full'}
                    </div>
                  ) : (
                    <div className={`text-sm font-medium ${
                      course.is_active ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {course.is_active ? 'Active' : 'Inactive'}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Student Actions */}
                  {user?.role === 'student' && (
                    <div className="flex space-x-2">
                      <Link
                        to={`/course-playlist/${course.id}`}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                      >
                        <i className="fas fa-play mr-1"></i>
                        View Materials
                      </Link>
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrolling === course.id || course.available_spots <= 0 || !course.is_active || !selectedProgram}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          course.available_spots > 0 && course.is_active && selectedProgram
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {enrolling === course.id ? (
                          <span>
                            <i className="fas fa-spinner fa-spin mr-1"></i>
                            Enrolling...
                          </span>
                        ) : !selectedProgram ? (
                          'Select Program First'
                        ) : course.available_spots > 0 && course.is_active ? (
                          'Enroll Now'
                        ) : (
                          'Course Full'
                        )}
                      </button>
                    </div>
                  )}

                  {/* Lecturer Actions */}
                  {user?.role === 'lecturer' && course.lecturer_name === user.name && (
                    <div className="flex space-x-2">
                      <Link
                        to={`/upload-materials/${course.id}`}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors text-center"
                      >
                        <i className="fas fa-upload mr-1"></i>
                        Upload Materials
                      </Link>
                      <Link
                        to={`/course-playlist/${course.id}`}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                      >
                        <i className="fas fa-eye mr-1"></i>
                        View Materials
                      </Link>
                    </div>
                  )}

                  {/* Admin Actions */}
                  {user?.role === 'admin' && (
                    <div className="flex space-x-2">
                      <Link
                        to={`/course-playlist/${course.id}`}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                      >
                        <i className="fas fa-eye mr-1"></i>
                        View Materials
                      </Link>
                      <Link
                        to={`/upload-materials/${course.id}`}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors text-center"
                      >
                        <i className="fas fa-upload mr-1"></i>
                        Upload Materials
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              <i className="fas fa-search"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters to find more courses.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses
