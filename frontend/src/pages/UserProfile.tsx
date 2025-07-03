import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../api/client";

interface UserProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  student_id?: string;
  employee_id?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

const UserProfile: React.FC = () => {
  console.log("UserProfile component mounted");
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    // Temporarily bypass API call for testing
    console.log("UserProfile useEffect called - bypassing API for testing");
    setLoading(false);
    // Set mock data for testing
    const mockData = {
      id: 1,
      name: user?.name || "Test User",
      email: user?.email || "test@example.com",
      role: user?.role || "admin",
      phone: "123-456-7890",
      address: "123 Test Street",
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setProfileData(mockData);
    setFormData({
      name: mockData.name,
      email: mockData.email,
      phone: mockData.phone,
      address: mockData.address,
    });
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      console.log("Fetching user profile...");
      const data = await apiClient.getUserProfile();
      console.log("User profile data:", data);
      setProfileData(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
      });
    } catch (err) {
      console.error("Error fetching user profile:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load user profile";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const updatedData = await apiClient.updateUserProfile(formData);
      setProfileData(updatedData);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profileData?.name || "",
      email: profileData?.email || "",
      phone: profileData?.phone || "",
      address: profileData?.address || "",
    });
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchUserProfile} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Profile
          </h1>
          <p className="text-gray-600">
            Manage your personal information and account settings
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-check-circle mr-2"></i>
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-600 font-bold text-3xl">
                    {profileData?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {profileData?.name}
                </h2>
                <p className="text-gray-600 mb-2">{profileData?.email}</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 capitalize">
                  {profileData?.role}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {profileData?.student_id && (
                  <div className="flex items-center text-sm">
                    <i className="fas fa-id-card text-gray-400 w-5"></i>
                    <span className="text-gray-600 ml-2">
                      Student ID: {profileData.student_id}
                    </span>
                  </div>
                )}
                {profileData?.employee_id && (
                  <div className="flex items-center text-sm">
                    <i className="fas fa-id-badge text-gray-400 w-5"></i>
                    <span className="text-gray-600 ml-2">
                      Employee ID: {profileData.employee_id}
                    </span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <i className="fas fa-calendar text-gray-400 w-5"></i>
                  <span className="text-gray-600 ml-2">
                    Joined:{" "}
                    {new Date(
                      profileData?.created_at || ""
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <i
                    className={`fas fa-circle text-${
                      profileData?.is_active ? "green" : "red"
                    }-400 w-5`}
                  ></i>
                  <span className="text-gray-600 ml-2">
                    Status: {profileData?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-outline btn-sm"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter your address"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <p className="text-gray-900">
                        {profileData?.name || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <p className="text-gray-900">
                        {profileData?.email || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <p className="text-gray-900">
                        {profileData?.phone || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <p className="text-gray-900">
                        {profileData?.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
