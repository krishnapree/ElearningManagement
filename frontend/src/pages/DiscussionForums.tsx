import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useParams, Link } from 'react-router-dom'

interface Forum {
  id: number
  title: string
  description: string
  thread_count: number
  latest_activity?: string
  latest_post_author?: string
  created_at: string
  is_pinned: boolean
}

interface Thread {
  id: number
  title: string
  content: string
  author: {
    id: number
    name: string
    role: string
  }
  post_count: number
  view_count: number
  is_pinned: boolean
  is_locked: boolean
  created_at: string
  last_activity: string
  latest_post_author: string
}

interface Post {
  id: number
  content: string
  author: {
    id: number
    name: string
    role: string
  }
  created_at: string
  updated_at?: string
  is_edited: boolean
  parent_post_id?: number
}

const DiscussionForums: React.FC = () => {
  const { user } = useAuth()
  const { courseId, forumId, threadId } = useParams()
  const [forums, setForums] = useState<Forum[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'forums' | 'threads' | 'posts'>('forums')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)

  const [newThread, setNewThread] = useState({
    title: '',
    content: ''
  })

  const [newPost, setNewPost] = useState({
    content: '',
    parent_post_id: null as number | null
  })

  useEffect(() => {
    if (courseId) {
      if (threadId) {
        setView('posts')
        fetchThreadPosts(parseInt(threadId))
      } else if (forumId) {
        setView('threads')
        fetchForumThreads(parseInt(forumId))
      } else {
        setView('forums')
        fetchCourseForums(parseInt(courseId))
      }
    }
  }, [courseId, forumId, threadId])

  const fetchCourseForums = async (courseId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${courseId}/forums`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setForums(data.forums)
      }
    } catch (error) {
      console.error('Failed to fetch forums:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchForumThreads = async (forumId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/forums/${forumId}/threads`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setThreads(data.threads)
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchThreadPosts = async (threadId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/threads/${threadId}/posts`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSelectedThread(data.thread)
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forumId) return

    try {
      const response = await fetch(`/api/forums/${forumId}/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newThread)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewThread({ title: '', content: '' })
        fetchForumThreads(parseInt(forumId))
      }
    } catch (error) {
      console.error('Failed to create thread:', error)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!threadId) return

    try {
      const response = await fetch(`/api/threads/${threadId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newPost)
      })

      if (response.ok) {
        setShowReplyModal(false)
        setNewPost({ content: '', parent_post_id: null })
        fetchThreadPosts(parseInt(threadId))
      }
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'text-red-600 bg-red-100'
      case 'lecturer':
        return 'text-blue-600 bg-blue-100'
      case 'student':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading discussion forums...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link to={`/courses/${courseId}/forums`} className="hover:text-primary-600">Forums</Link></li>
            {forumId && (
              <>
                <li><i className="fas fa-chevron-right"></i></li>
                <li><Link to={`/courses/${courseId}/forums/${forumId}`} className="hover:text-primary-600">Threads</Link></li>
              </>
            )}
            {threadId && (
              <>
                <li><i className="fas fa-chevron-right"></i></li>
                <li className="text-gray-900">Discussion</li>
              </>
            )}
          </ol>
        </nav>

        {/* Forums View */}
        {view === 'forums' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Discussion Forums</h1>
              {(user?.role === 'admin' || user?.role === 'lecturer') && (
                <button className="btn btn-primary">
                  <i className="fas fa-plus mr-2"></i>
                  Create Forum
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {forums.map((forum) => (
                <Link
                  key={forum.id}
                  to={`/courses/${courseId}/forums/${forum.id}`}
                  className="block p-6 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{forum.title}</h3>
                        {forum.is_pinned && (
                          <i className="fas fa-thumbtack text-primary-600"></i>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{forum.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          <i className="fas fa-comments mr-1"></i>
                          {forum.thread_count} threads
                        </span>
                        {forum.latest_activity && (
                          <span>
                            Last activity: {new Date(forum.latest_activity).toLocaleDateString()}
                            {forum.latest_post_author && ` by ${forum.latest_post_author}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Threads View */}
        {view === 'threads' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Discussion Threads</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <i className="fas fa-plus mr-2"></i>
                New Thread
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {threads.map((thread) => (
                <Link
                  key={thread.id}
                  to={`/courses/${courseId}/forums/${forumId}/threads/${thread.id}`}
                  className="block p-6 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{thread.title}</h3>
                        {thread.is_pinned && (
                          <i className="fas fa-thumbtack text-primary-600"></i>
                        )}
                        {thread.is_locked && (
                          <i className="fas fa-lock text-red-600"></i>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{thread.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(thread.author.role)}`}>
                          {thread.author.name}
                        </span>
                        <span>
                          <i className="fas fa-comments mr-1"></i>
                          {thread.post_count} replies
                        </span>
                        <span>
                          <i className="fas fa-eye mr-1"></i>
                          {thread.view_count} views
                        </span>
                        <span>
                          Last: {new Date(thread.last_activity).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Posts View */}
        {view === 'posts' && selectedThread && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{selectedThread.title}</h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedThread.author.role)}`}>
                    {selectedThread.author.name}
                  </span>
                  <span>{new Date(selectedThread.created_at).toLocaleDateString()}</span>
                  {selectedThread.is_pinned && (
                    <span className="text-primary-600">
                      <i className="fas fa-thumbtack mr-1"></i>
                      Pinned
                    </span>
                  )}
                  {selectedThread.is_locked && (
                    <span className="text-red-600">
                      <i className="fas fa-lock mr-1"></i>
                      Locked
                    </span>
                  )}
                </div>
              </div>
              {!selectedThread.is_locked && (
                <button
                  onClick={() => setShowReplyModal(true)}
                  className="btn btn-primary"
                >
                  <i className="fas fa-reply mr-2"></i>
                  Reply
                </button>
              )}
            </div>

            {/* Original Post */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
              <div className="prose max-w-none">
                <p>{selectedThread.content}</p>
              </div>
            </div>

            {/* Replies */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {post.author.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(post.author.role)}`}>
                          {post.author.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                        {post.is_edited && (
                          <span className="text-xs text-gray-400">(edited)</span>
                        )}
                      </div>
                      <div className="prose max-w-none">
                        <p>{post.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Thread Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Thread</h3>
              <form onSubmit={handleCreateThread} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newThread.title}
                    onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={newThread.content}
                    onChange={(e) => setNewThread({...newThread, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Create Thread
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reply to Thread</h3>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Reply</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReplyModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Post Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiscussionForums
