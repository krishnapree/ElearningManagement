import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Update the type for PREDEFINED_USERS
interface PredefinedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  subscription_status: string;
}

const PREDEFINED_USERS: Record<'admin' | 'lecturer' | 'student', PredefinedUser> = {
  admin: {
    id: 1,
    name: "System Administrator",
    email: "admin@lms.edu",
    role: "admin",
    subscription_status: "premium"
  },
  lecturer: {
    id: 2,
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@lms.edu",
    role: "lecturer",
    subscription_status: "premium"
  },
  student: {
    id: 3,
    name: "Alice Smith",
    email: "alice.smith@student.lms.edu",
    role: "student",
    subscription_status: "free"
  }
};

const RoleSwitcher: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleSwitch = (role: 'admin' | 'lecturer' | 'student') => {
    localStorage.setItem('selectedUser', JSON.stringify(PREDEFINED_USERS[role]));
    window.location.reload();
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: 'fas fa-shield-alt', name: 'Administrator' };
      case 'lecturer':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: 'fas fa-chalkboard-teacher', name: 'Lecturer' };
      case 'student':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: 'fas fa-user-graduate', name: 'Student' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: 'fas fa-user', name: 'User' };
    }
  };

  const currentRoleInfo = getRoleInfo(user?.role || 'student');

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentRoleInfo.bgColor}`}>
          <i className={`${currentRoleInfo.icon} ${currentRoleInfo.color} text-xs`}></i>
        </div>
        <span className="text-sm font-medium text-gray-700">{currentRoleInfo.name}</span>
        <i className={`fas fa-chevron-down text-xs text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 border-b border-gray-200">
            <p className="text-xs text-gray-500">Switch Role</p>
          </div>
          
          {Object.entries(PREDEFINED_USERS).map(([roleKey, userData]) => {
            const roleInfo = getRoleInfo(roleKey);
            const isCurrentRole = user?.role === roleKey;
            
            return (
              <button
                key={roleKey}
                onClick={() => handleRoleSwitch(roleKey as 'admin' | 'lecturer' | 'student')}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                  isCurrentRole ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                }`}
                disabled={isCurrentRole}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${roleInfo.bgColor}`}>
                  <i className={`${roleInfo.icon} ${roleInfo.color} text-xs`}></i>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{userData.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{roleInfo.name}</div>
                </div>
                {isCurrentRole && (
                  <i className="fas fa-check text-green-500 text-xs"></i>
                )}
              </button>
            );
          })}
          
          <div className="border-t border-gray-200 mt-2 pt-2">
            <button
              onClick={() => {
                localStorage.removeItem('selectedUser');
                navigate('/');
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <i className="fas fa-home text-gray-500 text-xs"></i>
              <span className="text-sm">Back to Home</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher; 