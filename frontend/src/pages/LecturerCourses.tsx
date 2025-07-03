import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  credits: number;
  capacity: number;
  enrolled_count: number;
  department_name: string;
  semester_name: string;
  is_active: boolean;
}

const LecturerCourses: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/lecturer/courses", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        setError("Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">Manage your courses and students</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <i className="fas fa-exclamation-circle text-red-400 mr-3 mt-0.5"></i>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-chalkboard-teacher text-gray-400 text-3xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Courses Assigned
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't been assigned any courses yet.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {course.code}
                    </h3>
                    <h4 className="text-md font-medium text-gray-700 mb-2">
                      {course.name}
                    </h4>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      course.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {course.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Department:</span>
                    <span className="font-medium">
                      {course.department_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Credits:</span>
                    <span className="font-medium">{course.credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Semester:</span>
                    <span className="font-medium">{course.semester_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Enrollment:</span>
                    <span className="font-medium">
                      {course.enrolled_count}/{course.capacity}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Enrollment</span>
                    <span>
                      {Math.round(
                        (course.enrolled_count / course.capacity) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (course.enrolled_count / course.capacity) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  <div className="flex space-x-2">
                    <Link
                      to={`/upload-materials/${course.id}`}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors text-center"
                    >
                      <i className="fas fa-upload mr-1"></i>
                      Upload Materials
                    </Link>
                    <Link
                      to={`/course-playlist/${course.id}`}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors text-center"
                    >
                      <i className="fas fa-play mr-1"></i>
                      View Materials
                    </Link>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/my-courses/${course.id}`}
                      className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors text-center"
                    >
                      <i className="fas fa-eye mr-1"></i>
                      View Details
                    </Link>
                    <Link
                      to={`/my-courses/${course.id}?tab=students`}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors text-center"
                    >
                      <i className="fas fa-users mr-1"></i>
                      Students
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerCourses;
