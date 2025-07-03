import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface ProgressData {
  date: string
  score: number
  topic?: string
}

interface TopicData {
  topic: string
  correct: number
  total: number
  percentage: number
}

interface ProgressChartProps {
  data: ProgressData[]
  topicData?: TopicData[]
  type?: 'line' | 'bar' | 'pie'
  title?: string
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  data, 
  topicData = [], 
  type = 'line', 
  title 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'score') {
      return [`${value}%`, 'Score']
    }
    return [value, name]
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip 
                labelFormatter={(label) => formatDate(label)}
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topicData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="topic" 
                stroke="#6B7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'percentage') {
                    return [`${value}%`, 'Accuracy']
                  }
                  return [value, name]
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="percentage" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topicData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ topic, percentage }) => `${topic}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="percentage"
              >
                {topicData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Accuracy']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  if (data.length === 0 && topicData.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <i className="fas fa-chart-line text-4xl mb-4"></i>
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-center">Start taking quizzes to see your progress here.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <i className="fas fa-chart-line mr-2 text-primary-500"></i>
            {title}
          </h3>
        </div>
      )}
      <div className="card-content">
        {renderChart()}
      </div>
    </div>
  )
}

export default ProgressChart
