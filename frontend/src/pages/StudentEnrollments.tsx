import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

interface Enrollment {
  id: number
  course_id: number
  course_name: string
  course_code: string
  course_description: string
  lecturer_name: string
  credits: number
  semester_name: string
  status: string
  enrollment_date: string
  final_grade?: string
  grade_points?: number
}

const StudentEnrollments: React.FC = () => {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEnrollments()
  }, [])

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching enrollments for user:', user?.id)
      
      const response = await fetch('/api/student/enrollments', {
        credentials: 'include'
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Enrollments data:', data)
        setEnrollments(data.enrollments || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', errorData)
        setError(`Failed to fetch enrollments: ${errorData.detail || response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      setError('Failed to fetch enrollments: Network error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading enrollments...</p>
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
            My Enrollments
          </h1>
          <p className="text-gray-600">
            View and manage your course enrollments
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <i className="fas fa-exclamation-circle text-red-400 mr-3 mt-0.5"></i>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchEnrollments}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enrollments Grid */}
        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-graduation-cap text-gray-400 text-3xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Enrollments</h3>
            <p className="text-gray-600 mb-6">You haven't enrolled in any courses yet.</p>
            <a
              href="/courses"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <i className="fas fa-search mr-2"></i>
              Browse Courses
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {enrollment.course_code}: {enrollment.course_name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        enrollment.status === 'enrolled' 
                          ? 'bg-green-100 text-green-800'
                          : enrollment.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{enrollment.course_description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Lecturer:</span>
                        <p className="font-medium">{enrollment.lecturer_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Credits:</span>
                        <p className="font-medium">{enrollment.credits}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Semester:</span>
                        <p className="font-medium">{enrollment.semester_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Enrolled:</span>
                        <p className="font-medium">
                          {new Date(enrollment.enrollment_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {enrollment.final_grade && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Final Grade:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">
                              {enrollment.final_grade}
                            </span>
                            {enrollment.grade_points && (
                              <span className="text-sm text-gray-600">
                                ({enrollment.grade_points.toFixed(1)} GPA)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentEnrollments
