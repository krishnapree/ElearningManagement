import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

interface Course {
  id: number
  name: string
  code: string
  lecturer: string
}

interface Discussion {
  id: number
  title: string
  content: string
  author: string
  author_role: string
  created_at: string
  updated_at: string
  replies_count: number
  last_reply_at?: string
  last_reply_author?: string
  is_pinned: boolean
  is_locked: boolean
  course_id: number
  course_name: string
  course_code: string
}

interface Reply {
  id: number
  content: string
  author: string
  author_role: string
  created_at: string
  updated_at: string
  discussion_id: number
}

const StudentDiscussions: React.FC = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [replies, setReplies] = useState<Reply[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'list' | 'discussion'>('list')
  
  // Forms
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: ''
  })
  const [newReply, setNewReply] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchDiscussions()
    }
  }, [selectedCourse])

  useEffect(() => {
    if (selectedDiscussion) {
      fetchReplies()
    }
  }, [selectedDiscussion])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/enrolled-courses', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
        if (data.courses.length > 0 && !selectedCourse) {
          setSelectedCourse(data.courses[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDiscussions = async () => {
    if (!selectedCourse) return

    try {
      const response = await fetch(`/api/courses/${selectedCourse}/discussions`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDiscussions(data.discussions || [])
      }
    } catch (error) {
      console.error('Error fetching discussions:', error)
    }
  }

  const fetchReplies = async () => {
    if (!selectedDiscussion) return

    try {
      const response = await fetch(`/api/discussions/${selectedDiscussion.id}/replies`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setReplies(data.replies || [])
      }
    } catch (error) {
      console.error('Error fetching replies:', error)
    }
  }

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return

    try {
      setSubmitting(true)
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...newDiscussion,
          course_id: selectedCourse
        })
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewDiscussion({ title: '', content: '' })
        fetchDiscussions()
      }
    } catch (error) {
      console.error('Failed to create discussion:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDiscussion || !newReply.trim()) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/discussions/${selectedDiscussion.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newReply
        })
      })

      if (response.ok) {
        setNewReply('')
        fetchReplies()
        fetchDiscussions() // Update reply count
      }
    } catch (error) {
      console.error('Failed to create reply:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'lecturer':
      case 'instructor':
        return 'bg-blue-100 text-blue-800'
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'student':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const selectedCourseData = courses.find(c => c.id === selectedCourse)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading discussions...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Discussions</h1>
              <p className="text-gray-600">Participate in course discussions and forums</p>
            </div>
            
            {activeView === 'list' && selectedCourse && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                New Discussion
              </button>
            )}
            
            {activeView === 'discussion' && (
              <button
                onClick={() => {
                  setActiveView('list')
                  setSelectedDiscussion(null)
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Discussions
              </button>
            )}
          </div>
        </div>

        {/* Course Selector */}
        {activeView === 'list' && (
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* Discussions List */}
        {activeView === 'list' && selectedCourse && (
          <div className="space-y-4">
            {discussions.map((discussion) => (
              <div key={discussion.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {discussion.is_pinned && (
                        <i className="fas fa-thumbtack text-primary-600 mr-2"></i>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">
                        {discussion.title}
                      </h3>
                      {discussion.is_locked && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <i className="fas fa-lock mr-1"></i>
                          Locked
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{discussion.content}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(discussion.author_role)} mr-2`}>
                          {discussion.author_role}
                        </span>
                        {discussion.author}
                      </span>
                      <span>
                        <i className="fas fa-calendar mr-1"></i>
                        {new Date(discussion.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        <i className="fas fa-comments mr-1"></i>
                        {discussion.replies_count} replies
                      </span>
                      {discussion.last_reply_at && (
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          Last reply: {new Date(discussion.last_reply_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDiscussion(discussion)
                      setActiveView('discussion')
                    }}
                    className="ml-6 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    <i className="fas fa-eye mr-2"></i>
                    View
                  </button>
                </div>
              </div>
            ))}

            {discussions.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-comments text-gray-400 text-3xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
                <p className="text-gray-600 mb-4">Be the first to start a discussion in this course!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Start Discussion
                </button>
              </div>
            )}
          </div>
        )}

        {/* Discussion Detail */}
        {activeView === 'discussion' && selectedDiscussion && (
          <div className="space-y-6">
            {/* Discussion Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                {selectedDiscussion.is_pinned && (
                  <i className="fas fa-thumbtack text-primary-600 mr-2"></i>
                )}
                <h2 className="text-2xl font-bold text-gray-900">{selectedDiscussion.title}</h2>
                {selectedDiscussion.is_locked && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <i className="fas fa-lock mr-1"></i>
                    Locked
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(selectedDiscussion.author_role)} mr-2`}>
                    {selectedDiscussion.author_role}
                  </span>
                  {selectedDiscussion.author}
                </span>
                <span>
                  <i className="fas fa-calendar mr-1"></i>
                  {new Date(selectedDiscussion.created_at).toLocaleDateString()}
                </span>
                <span>
                  <i className="fas fa-book mr-1"></i>
                  {selectedDiscussion.course_code}
                </span>
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{selectedDiscussion.content}</p>
              </div>
            </div>

            {/* Replies */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Replies ({replies.length})
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {replies.map((reply) => (
                  <div key={reply.id} className="p-6">
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(reply.author_role)} mr-2`}>
                          {reply.author_role}
                        </span>
                        <span className="font-medium text-gray-900">{reply.author}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        <i className="fas fa-calendar mr-1"></i>
                        {new Date(reply.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="prose max-w-none">
                      <p className="text-gray-700">{reply.content}</p>
                    </div>
                  </div>
                ))}
                
                {replies.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No replies yet. Be the first to reply!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reply Form */}
            {!selectedDiscussion.is_locked && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Reply</h3>
                <form onSubmit={handleCreateReply}>
                  <div className="mb-4">
                    <textarea
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Write your reply..."
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !newReply.trim()}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Posting...' : 'Post Reply'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Start New Discussion</h3>
            </div>
            
            <form onSubmit={handleCreateDiscussion} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Discussion title..."
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Start the discussion..."
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewDiscussion({ title: '', content: '' })
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Discussion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDiscussions
