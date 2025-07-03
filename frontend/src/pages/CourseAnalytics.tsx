import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Course {
  id: number;
  name: string;
  code: string;
  enrolled_count: number;
  max_capacity: number;
}

interface AnalyticsData {
  course_performance: {
    course_id: number;
    course_name: string;
    course_code: string;
    total_students: number;
    average_grade: number;
    completion_rate: number;
    assignment_count: number;
    quiz_count: number;
  }[];
  student_engagement: {
    date: string;
    active_students: number;
    submissions: number;
    quiz_attempts: number;
  }[];
  grade_distribution: {
    grade_range: string;
    count: number;
  }[];
  assignment_performance: {
    assignment_name: string;
    average_score: number;
    submission_rate: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CourseAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester'>('month');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAnalytics();
    }
  }, [selectedCourse, timeRange]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/lecturer/courses', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
        if (data.courses.length > 0) {
          setSelectedCourse(data.courses[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${selectedCourse}/analytics?timeRange=${timeRange}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Mock data for demonstration
      setAnalyticsData({
        course_performance: [{
          course_id: selectedCourse,
          course_name: 'Sample Course',
          course_code: 'CS101',
          total_students: 45,
          average_grade: 82.5,
          completion_rate: 78.5,
          assignment_count: 8,
          quiz_count: 12
        }],
        student_engagement: [
          { date: '2024-01-01', active_students: 35, submissions: 28, quiz_attempts: 42 },
          { date: '2024-01-02', active_students: 38, submissions: 31, quiz_attempts: 45 },
          { date: '2024-01-03', active_students: 42, submissions: 35, quiz_attempts: 48 },
          { date: '2024-01-04', active_students: 40, submissions: 33, quiz_attempts: 46 },
          { date: '2024-01-05', active_students: 44, submissions: 37, quiz_attempts: 50 }
        ],
        grade_distribution: [
          { grade_range: 'A (90-100)', count: 12 },
          { grade_range: 'B (80-89)', count: 18 },
          { grade_range: 'C (70-79)', count: 10 },
          { grade_range: 'D (60-69)', count: 4 },
          { grade_range: 'F (0-59)', count: 1 }
        ],
        assignment_performance: [
          { assignment_name: 'Assignment 1', average_score: 85.2, submission_rate: 95.5 },
          { assignment_name: 'Assignment 2', average_score: 78.8, submission_rate: 88.9 },
          { assignment_name: 'Assignment 3', average_score: 82.1, submission_rate: 91.1 },
          { assignment_name: 'Midterm Project', average_score: 79.5, submission_rate: 86.7 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Analytics</h1>
          <p className="text-gray-600">Track student performance and engagement across your courses</p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse || ''}
              onChange={(e) => setSelectedCourse(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'semester')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="semester">This Semester</option>
            </select>
          </div>
        </div>

        {analyticsData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.course_performance[0]?.total_students || 0}
                </div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.course_performance[0]?.average_grade?.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-gray-600">Average Grade</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData.course_performance[0]?.completion_rate?.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-2xl font-bold text-orange-600">
                  {analyticsData.course_performance[0]?.assignment_count || 0}
                </div>
                <div className="text-sm text-gray-600">Assignments</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Student Engagement */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Engagement</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.student_engagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="active_students" stroke="#8884d8" name="Active Students" />
                    <Line type="monotone" dataKey="submissions" stroke="#82ca9d" name="Submissions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Grade Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.grade_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ grade_range, percent }) => `${grade_range}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.grade_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Assignment Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.assignment_performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="assignment_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="average_score" fill="#8884d8" name="Average Score %" />
                  <Bar dataKey="submission_rate" fill="#82ca9d" name="Submission Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseAnalytics;
