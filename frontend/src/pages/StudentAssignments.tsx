import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

interface Assignment {
  id: number
  title: string
  description: string
  course_name: string
  course_code: string
  due_date: string
  max_points: number
  assignment_type: string
  is_submitted: boolean
  submission_date?: string
  grade?: number
  feedback?: string
  is_late: boolean
  days_until_due: number
  file_name?: string
}

interface Submission {
  id: number
  assignment_id: number
  file_name?: string
  comments: string
  submitted_at: string
  grade?: number
  feedback?: string
  is_late: boolean
}

const StudentAssignments: React.FC = () => {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'graded'>('pending')
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [submissionComments, setSubmissionComments] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAssignments()
    fetchSubmissions()
  }, [])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/assignments', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/student/submissions', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment || !submissionFile) return

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('file', submissionFile)
      formData.append('comments', submissionComments)

      const response = await fetch(`/api/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        setShowSubmissionModal(false)
        setSelectedAssignment(null)
        setSubmissionFile(null)
        setSubmissionComments('')
        fetchAssignments()
        fetchSubmissions()
      }
    } catch (error) {
      console.error('Failed to submit assignment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (assignment: Assignment) => {
    if (assignment.grade !== undefined) return 'text-green-600'
    if (assignment.is_submitted) return 'text-blue-600'
    if (assignment.days_until_due < 0) return 'text-red-600'
    if (assignment.days_until_due <= 3) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getStatusText = (assignment: Assignment) => {
    if (assignment.grade !== undefined) return `Graded (${assignment.grade}/${assignment.max_points})`
    if (assignment.is_submitted) return 'Submitted'
    if (assignment.days_until_due < 0) return 'Overdue'
    if (assignment.days_until_due === 0) return 'Due Today'
    if (assignment.days_until_due <= 3) return `Due in ${assignment.days_until_due} days`
    return `Due in ${assignment.days_until_due} days`
  }

  const filteredAssignments = assignments.filter(assignment => {
    switch (activeTab) {
      case 'pending':
        return !assignment.is_submitted && assignment.grade === undefined
      case 'submitted':
        return assignment.is_submitted && assignment.grade === undefined
      case 'graded':
        return assignment.grade !== undefined
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assignments</h1>
          <p className="text-gray-600">Track and submit your course assignments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {assignments.filter(a => !a.is_submitted && a.grade === undefined).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-paper-plane text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Submitted</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {assignments.filter(a => a.is_submitted && a.grade === undefined).length}
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
                <p className="text-sm font-medium text-gray-500">Graded</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {assignments.filter(a => a.grade !== undefined).length}
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
                  {assignments.filter(a => a.grade !== undefined).length > 0
                    ? Math.round(
                        assignments
                          .filter(a => a.grade !== undefined)
                          .reduce((sum, a) => sum + (a.grade! / a.max_points * 100), 0) /
                        assignments.filter(a => a.grade !== undefined).length
                      )
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
                { key: 'pending', label: 'Pending', icon: 'fa-clock' },
                { key: 'submitted', label: 'Submitted', icon: 'fa-paper-plane' },
                { key: 'graded', label: 'Graded', icon: 'fa-check-circle' }
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

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 mr-3">
                      {assignment.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment)} bg-gray-100`}>
                      {getStatusText(assignment)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{assignment.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      <i className="fas fa-book mr-1"></i>
                      {assignment.course_code}: {assignment.course_name}
                    </span>
                    <span>
                      <i className="fas fa-calendar mr-1"></i>
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </span>
                    <span>
                      <i className="fas fa-star mr-1"></i>
                      {assignment.max_points} points
                    </span>
                    <span>
                      <i className="fas fa-tag mr-1"></i>
                      {assignment.assignment_type}
                    </span>
                  </div>

                  {assignment.feedback && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">Instructor Feedback:</h4>
                      <p className="text-blue-800 text-sm">{assignment.feedback}</p>
                    </div>
                  )}
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  {!assignment.is_submitted && assignment.grade === undefined && (
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment)
                        setShowSubmissionModal(true)
                      }}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      <i className="fas fa-upload mr-2"></i>
                      Submit
                    </button>
                  )}
                  
                  {assignment.file_name && (
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                      <i className="fas fa-download mr-2"></i>
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-tasks text-gray-400 text-3xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
              <p className="text-gray-600">No assignments in this category yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Submit Assignment</h3>
              <p className="text-sm text-gray-600">{selectedAssignment.title}</p>
            </div>
            
            <form onSubmit={handleSubmitAssignment} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={submissionComments}
                  onChange={(e) => setSubmissionComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Add any comments about your submission..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmissionModal(false)
                    setSelectedAssignment(null)
                    setSubmissionFile(null)
                    setSubmissionComments('')
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !submissionFile}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentAssignments
