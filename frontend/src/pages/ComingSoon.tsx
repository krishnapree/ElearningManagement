import React from 'react'

interface ComingSoonProps {
  title: string
  description: string
  icon: string
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title, description, icon }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="text-6xl text-primary-600 mb-6">
          <i className={`fas ${icon}`}></i>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        <p className="text-gray-600 mb-8">
          {description}
        </p>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🚀 Coming Soon Features:
          </h3>
          <ul className="text-left space-y-2 text-gray-600">
            <li className="flex items-center">
              <i className="fas fa-check text-green-500 mr-2"></i>
              Role-based dashboards
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-500 mr-2"></i>
              Course management
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-500 mr-2"></i>
              Student enrollment
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-500 mr-2"></i>
              Academic analytics
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-green-500 mr-2"></i>
              Parent portal
            </li>
          </ul>
        </div>
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            The MasterLMS backend is ready! Frontend pages are being developed.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ComingSoon
