import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

interface AcademicRecord {
  student_info: {
    name: string
    student_id: string
    email: string
    program: string
    department: string
    admission_date: string
    expected_graduation: string
    academic_standing: string
  }
  overall_gpa: number
  total_credits_earned: number
  total_credits_attempted: number
  cumulative_gpa: number
}

interface SemesterRecord {
  semester_id: number
  semester_name: string
  year: number
  semester_gpa: number
  credits_earned: number
  credits_attempted: number
  courses: CourseRecord[]
}

interface CourseRecord {
  course_code: string
  course_name: string
  credits: number
  grade: string
  grade_points: number
  instructor: string
  final_percentage: number
}

interface Transcript {
  semesters: SemesterRecord[]
  academic_summary: {
    cumulative_gpa: number
    total_credits: number
    major_gpa: number
    academic_standing: string
    honors: string[]
  }
}

const StudentAcademicRecords: React.FC = () => {
  const { user } = useAuth()
  const [academicRecord, setAcademicRecord] = useState<AcademicRecord | null>(null)
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'progress'>('overview')

  useEffect(() => {
    fetchAcademicRecords()
  }, [])

  const fetchAcademicRecords = async () => {
    try {
      setLoading(true)
      
      // Fetch academic record overview
      const recordResponse = await fetch('/api/student/academic-record', {
        credentials: 'include'
      })
      if (recordResponse.ok) {
        const recordData = await recordResponse.json()
        setAcademicRecord(recordData.record)
      }

      // Fetch transcript
      const transcriptResponse = await fetch('/api/student/transcript', {
        credentials: 'include'
      })
      if (transcriptResponse.ok) {
        const transcriptData = await transcriptResponse.json()
        setTranscript(transcriptData.transcript)
      }

    } catch (error) {
      console.error('Error fetching academic records:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadTranscript = async () => {
    try {
      const response = await fetch('/api/student/transcript/download', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transcript_${user?.student_id || 'student'}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading transcript:', error)
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-100'
      case 'A-':
      case 'B+':
      case 'B':
        return 'text-blue-600 bg-blue-100'
      case 'B-':
      case 'C+':
      case 'C':
        return 'text-yellow-600 bg-yellow-100'
      case 'C-':
      case 'D+':
      case 'D':
        return 'text-orange-600 bg-orange-100'
      case 'F':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getAcademicStandingColor = (standing: string) => {
    switch (standing.toLowerCase()) {
      case 'excellent':
      case 'dean\'s list':
        return 'text-green-600 bg-green-100'
      case 'good standing':
        return 'text-blue-600 bg-blue-100'
      case 'satisfactory':
        return 'text-yellow-600 bg-yellow-100'
      case 'probation':
        return 'text-orange-600 bg-orange-100'
      case 'suspension':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading academic records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Records</h1>
              <p className="text-gray-600">View your complete academic history and transcripts</p>
            </div>
            
            <button
              onClick={downloadTranscript}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <i className="fas fa-download mr-2"></i>
              Download Transcript
            </button>
          </div>
        </div>

        {/* Student Info Card */}
        {academicRecord && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Student Information</h3>
                <p className="text-lg font-semibold text-gray-900">{academicRecord.student_info.name}</p>
                <p className="text-sm text-gray-600">ID: {academicRecord.student_info.student_id}</p>
                <p className="text-sm text-gray-600">{academicRecord.student_info.email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Program</h3>
                <p className="text-lg font-semibold text-gray-900">{academicRecord.student_info.program}</p>
                <p className="text-sm text-gray-600">{academicRecord.student_info.department}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Academic Standing</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAcademicStandingColor(academicRecord.student_info.academic_standing)}`}>
                  {academicRecord.student_info.academic_standing}
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Cumulative GPA: {academicRecord.cumulative_gpa.toFixed(2)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Timeline</h3>
                <p className="text-sm text-gray-600">
                  Admitted: {new Date(academicRecord.student_info.admission_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  Expected Graduation: {new Date(academicRecord.student_info.expected_graduation).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Academic Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-graduation-cap text-primary-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cumulative GPA</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {academicRecord?.cumulative_gpa.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-book text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Credits Earned</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {academicRecord?.total_credits_earned || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Credits Attempted</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {academicRecord?.total_credits_attempted || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-percentage text-purple-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {academicRecord && academicRecord.total_credits_attempted > 0
                    ? Math.round((academicRecord.total_credits_earned / academicRecord.total_credits_attempted) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: 'fa-chart-line' },
                { key: 'transcript', label: 'Official Transcript', icon: 'fa-file-alt' },
                { key: 'progress', label: 'Degree Progress', icon: 'fa-tasks' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && transcript && (
          <div className="space-y-6">
            {/* Academic Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Overall GPA</p>
                  <p className="text-xl font-semibold text-gray-900">{transcript.academic_summary.cumulative_gpa.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Major GPA</p>
                  <p className="text-xl font-semibold text-gray-900">{transcript.academic_summary.major_gpa.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Credits</p>
                  <p className="text-xl font-semibold text-gray-900">{transcript.academic_summary.total_credits}</p>
                </div>
              </div>
              
              {transcript.academic_summary.honors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">Academic Honors</p>
                  <div className="flex flex-wrap gap-2">
                    {transcript.academic_summary.honors.map((honor, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <i className="fas fa-award mr-1"></i>
                        {honor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Semesters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Semesters</h3>
              <div className="space-y-4">
                {transcript.semesters.slice(-3).map((semester) => (
                  <div key={semester.semester_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {semester.semester_name} {semester.year}
                      </h4>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Semester GPA</p>
                        <p className="font-semibold text-gray-900">{semester.semester_gpa.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Credits Earned:</span>
                        <span className="ml-2 font-medium">{semester.credits_earned}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Courses:</span>
                        <span className="ml-2 font-medium">{semester.courses.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transcript' && transcript && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Official Transcript</h3>
            </div>
            
            <div className="p-6">
              {transcript.semesters.map((semester) => (
                <div key={semester.semester_id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      {semester.semester_name} {semester.year}
                    </h4>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Semester GPA: {semester.semester_gpa.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Credits: {semester.credits_earned}/{semester.credits_attempted}</p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {semester.courses.map((course, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{course.course_code}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{course.course_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{course.credits}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(course.grade)}`}>
                                {course.grade}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{course.grade_points.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{course.instructor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Degree Progress</h3>
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-pie text-gray-400 text-3xl"></i>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Degree Progress Tracking</h4>
              <p className="text-gray-600 mb-4">
                Detailed degree progress tracking with requirement completion status will be available soon.
              </p>
              <p className="text-sm text-gray-500">
                This feature will show your progress towards graduation requirements, including major requirements, 
                general education, and elective credits.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentAcademicRecords
