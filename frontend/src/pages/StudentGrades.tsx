import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

interface Grade {
  id: number
  assignment_title: string
  course_name: string
  course_code: string
  grade: number
  max_points: number
  percentage: number
  assignment_type: string
  submitted_date: string
  graded_date: string
  feedback?: string
  is_late: boolean
}

interface CourseGrade {
  course_id: number
  course_name: string
  course_code: string
  credits: number
  current_grade: number
  letter_grade: string
  assignments_completed: number
  total_assignments: number
  attendance_percentage: number
}

interface Semester {
  id: number
  name: string
  year: number
  gpa: number
  credits: number
  is_current: boolean
}

const StudentGrades: React.FC = () => {
  const { user } = useAuth()
  const [grades, setGrades] = useState<Grade[]>([])
  const [courseGrades, setCourseGrades] = useState<CourseGrade[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'assignments'>('overview')

  useEffect(() => {
    fetchGradesData()
  }, [selectedSemester])

  const fetchGradesData = async () => {
    try {
      setLoading(true)
      
      // Fetch semesters
      const semestersResponse = await fetch('/api/student/semesters', {
        credentials: 'include'
      })
      if (semestersResponse.ok) {
        const semestersData = await semestersResponse.json()
        setSemesters(semestersData.semesters || [])
        if (!selectedSemester && semestersData.semesters.length > 0) {
          const currentSemester = semestersData.semesters.find((s: Semester) => s.is_current)
          setSelectedSemester(currentSemester?.id || semestersData.semesters[0].id)
        }
      }

      // Fetch grades for selected semester
      const gradesResponse = await fetch(`/api/student/grades${selectedSemester ? `?semester_id=${selectedSemester}` : ''}`, {
        credentials: 'include'
      })
      if (gradesResponse.ok) {
        const gradesData = await gradesResponse.json()
        setGrades(gradesData.grades || [])
      }

      // Fetch course grades
      const courseGradesResponse = await fetch(`/api/student/course-grades${selectedSemester ? `?semester_id=${selectedSemester}` : ''}`, {
        credentials: 'include'
      })
      if (courseGradesResponse.ok) {
        const courseGradesData = await courseGradesResponse.json()
        setCourseGrades(courseGradesData.course_grades || [])
      }

    } catch (error) {
      console.error('Error fetching grades data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLetterGrade = (percentage: number) => {
    if (percentage >= 97) return 'A+'
    if (percentage >= 93) return 'A'
    if (percentage >= 90) return 'A-'
    if (percentage >= 87) return 'B+'
    if (percentage >= 83) return 'B'
    if (percentage >= 80) return 'B-'
    if (percentage >= 77) return 'C+'
    if (percentage >= 73) return 'C'
    if (percentage >= 70) return 'C-'
    if (percentage >= 67) return 'D+'
    if (percentage >= 63) return 'D'
    if (percentage >= 60) return 'D-'
    return 'F'
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100'
    if (percentage >= 80) return 'text-blue-600 bg-blue-100'
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100'
    if (percentage >= 60) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const currentSemester = semesters.find(s => s.id === selectedSemester)
  const overallGPA = currentSemester?.gpa || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading grades...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Grades</h1>
              <p className="text-gray-600">Track your academic performance and progress</p>
            </div>
            
            {/* Semester Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Semester:</label>
              <select
                value={selectedSemester || ''}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name} {semester.year} {semester.is_current && '(Current)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GPA Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-graduation-cap text-primary-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current GPA</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {overallGPA.toFixed(2)}
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
                <p className="text-sm font-medium text-gray-500">Courses</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {courseGrades.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Assignments Graded</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {grades.length}
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
                <p className="text-sm font-medium text-gray-500">Average Grade</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {grades.length > 0 
                    ? Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length)
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
                { key: 'courses', label: 'Course Grades', icon: 'fa-book' },
                { key: 'assignments', label: 'Assignment Grades', icon: 'fa-tasks' }
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Grade Distribution Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
              <div className="space-y-3">
                {['A', 'B', 'C', 'D', 'F'].map((letter) => {
                  const count = grades.filter(g => getLetterGrade(g.percentage) === letter).length
                  const percentage = grades.length > 0 ? (count / grades.length) * 100 : 0
                  return (
                    <div key={letter} className="flex items-center">
                      <div className="w-8 text-sm font-medium text-gray-700">{letter}:</div>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-12 text-sm text-gray-600">{count}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent Grades */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Grades</h3>
              <div className="space-y-3">
                {grades.slice(0, 5).map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{grade.assignment_title}</div>
                      <div className="text-sm text-gray-500">{grade.course_code}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(grade.percentage)}`}>
                        {grade.grade}/{grade.max_points}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{grade.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Letter Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courseGrades.map((course) => (
                    <tr key={course.course_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{course.course_name}</div>
                          <div className="text-sm text-gray-500">{course.course_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.credits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(course.current_grade)}`}>
                          {course.current_grade.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {course.letter_grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${(course.assignments_completed / course.total_assignments) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {course.assignments_completed}/{course.total_assignments}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${course.attendance_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{course.attendance_percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.map((grade) => (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{grade.assignment_title}</div>
                        {grade.feedback && (
                          <div className="text-xs text-gray-500 mt-1">Has feedback</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{grade.course_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {grade.assignment_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {grade.grade}/{grade.max_points}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(grade.percentage)}`}>
                          {grade.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(grade.submitted_date).toLocaleDateString()}
                          {grade.is_late && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Late
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentGrades
