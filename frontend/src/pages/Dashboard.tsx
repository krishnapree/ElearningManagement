import React, { useState, useEffect } from 'react'
import ProgressChart from '../components/ProgressChart'

interface DashboardData {
  overall_score: number
  total_questions: number
  correct_answers: number
  recent_activity: Array<{
    date: string
    score: number
    topic: string
  }>
  topic_performance: Array<{
    topic: string
    correct: number
    total: number
    percentage: number
  }>
  streak: number
  achievements: Array<{
    id: string
    title: string
    description: string
    earned_date: string
    icon: string
  }>
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')

  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?range=${timeRange}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card">
          <div className="card-content text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-chart-line text-gray-400 text-3xl"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
            <p className="text-gray-600 mb-6">Start taking quizzes to see your learning progress here.</p>
            <button
              onClick={() => window.location.href = '/quiz'}
              className="btn btn-primary"
            >
              <i className="fas fa-play mr-2"></i>
              Take Your First Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'text-green-600'
    if (streak >= 3) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Dashboard</h1>
            <p className="text-gray-600">Track your progress and achievements</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Time Range:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'all')}
                className="input w-auto"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(data.overall_score)}`}>
                  {data.overall_score}%
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-percentage text-primary-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Questions Answered</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_questions}</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-question-circle text-success-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Correct Answers</p>
                <p className="text-2xl font-bold text-green-600">{data.correct_answers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-green-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className={`text-2xl font-bold ${getStreakColor(data.streak)}`}>
                  {data.streak} {data.streak === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-fire text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <ProgressChart
          data={data.recent_activity}
          type="line"
          title="Score Trend"
        />
        <ProgressChart
          data={[]}
          topicData={data.topic_performance}
          type="bar"
          title="Performance by Topic"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
            </div>
            <div className="card-content">
              {data.recent_activity.length > 0 ? (
                <div className="space-y-4">
                  {data.recent_activity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-quiz text-primary-600 text-sm"></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.topic} Quiz</p>
                          <p className="text-sm text-gray-600">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-semibold ${getScoreColor(activity.score)}`}>
                        {activity.score}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-history text-gray-400 text-3xl mb-4"></i>
                  <p className="text-gray-600">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Achievements</h3>
          </div>
          <div className="card-content">
            {data.achievements.length > 0 ? (
              <div className="space-y-3">
                {data.achievements.slice(0, 4).map((achievement) => (
                  <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className={`fas ${achievement.icon} text-yellow-600 text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{achievement.title}</p>
                      <p className="text-xs text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-trophy text-gray-400 text-3xl mb-4"></i>
                <p className="text-gray-600 text-sm">No achievements yet</p>
                <p className="text-gray-500 text-xs">Keep learning to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => window.location.href = '/quiz'}
          className="btn btn-primary"
        >
          <i className="fas fa-play mr-2"></i>
          Take Another Quiz
        </button>
        <button
          onClick={() => window.location.href = '/ask'}
          className="btn btn-outline"
        >
          <i className="fas fa-question mr-2"></i>
          Ask AI a Question
        </button>
      </div>
    </div>
  )
}

export default Dashboard
