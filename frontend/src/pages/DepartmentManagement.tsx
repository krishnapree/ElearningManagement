import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  head_name?: string;
  total_programs: number;
  total_courses: number;
  total_students: number;
  is_active: boolean;
  created_at: string;
}

interface DepartmentForm {
  name: string;
  code: string;
  description: string;
  head_name?: string;
  is_active: boolean;
}

const DepartmentManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [formData, setFormData] = useState<DepartmentForm>({
    name: "",
    code: "",
    description: "",
    head_name: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/academic/departments", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      } else {
        setError("Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description,
        head_name: department.head_name || "",
        is_active: department.is_active,
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        head_name: "",
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleViewDepartment = (department: Department) => {
    navigate(`/departments/${department.id}`);
  };

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingDepartment
        ? `/api/academic/departments/${editingDepartment.id}`
        : "/api/academic/departments";

      const method = editingDepartment ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchDepartments();
        setSuccessMessage(
          editingDepartment
            ? "Department updated successfully!"
            : "Department created successfully!"
        );
        closeModal();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to save department");
      }
    } catch (error) {
      console.error("Error saving department:", error);
      setError("Failed to save department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (departmentId: number, force: boolean = false) => {
    try {
      setError(null);
      setSuccessMessage(null);

      if (!force) {
        // First check if the department can be deleted
        const checkResponse = await fetch(
          `/api/academic/departments/${departmentId}/can-delete`,
          {
            credentials: "include",
          }
        );

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();

          if (!checkData.can_delete) {
            // Show detailed error message with force delete option
            const forceDelete = confirm(
              `Cannot delete department: ${checkData.reason}\n\nDo you want to FORCE DELETE this department? This will:\n- Deactivate all programs in this department\n- Deactivate all courses in this department\n- Unassign all lecturers from this department\n\nThis action cannot be undone!`
            );

            if (forceDelete) {
              return handleDelete(departmentId, true); // Recursive call with force=true
            }
            return;
          }
        }

        // If we can delete normally, show confirmation
        if (
          !confirm(
            "Are you sure you want to delete this department? This action cannot be undone."
          )
        ) {
          return;
        }
      } else {
        // Force delete confirmation
        if (
          !confirm(
            "⚠️ FORCE DELETE CONFIRMATION ⚠️\n\nThis will permanently deactivate:\n- All programs in this department\n- All courses in this department\n- All lecturer assignments\n\nAre you absolutely sure?"
          )
        ) {
          return;
        }
      }

      const response = await fetch(
        `/api/academic/departments/${departmentId}?force=${force}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        await fetchDepartments();
        setSuccessMessage(
          force
            ? "Department force deleted successfully! All related data has been deactivated."
            : "Department deleted successfully!"
        );
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to delete department");
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      setError("Failed to delete department");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Department Management
            </h1>
            <p className="text-gray-600">
              Manage academic departments and their structure
            </p>
          </div>
          <button
            type="button"
            onClick={() => openModal()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Add Department
          </button>
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

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <i className="fas fa-check-circle text-green-400 mr-3 mt-0.5"></i>
              <div>
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Departments Grid */}
        {departments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-building text-gray-400 text-3xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Departments
            </h3>
            <p className="text-gray-600 mb-6">
              No departments have been created yet.
            </p>
            <button
              type="button"
              onClick={() => openModal()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Create First Department
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((department) => (
              <div
                key={department.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {department.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Code: {department.code}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      department.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {department.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {department.description}
                </p>

                {department.head_name && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <i className="fas fa-user-tie text-gray-400 mr-2"></i>
                      <div>
                        <p className="text-xs text-gray-500">Department Head</p>
                        <p className="text-sm font-medium text-gray-900">
                          {department.head_name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600">
                      {department.total_programs}
                    </div>
                    <div className="text-xs text-gray-500">Programs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {department.total_courses}
                    </div>
                    <div className="text-xs text-gray-500">Courses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {department.total_students}
                    </div>
                    <div className="text-xs text-gray-500">Students</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleViewDepartment(department)}
                    className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors"
                  >
                    <i className="fas fa-eye mr-1"></i>
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal(department)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(department.id)}
                    className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200 transition-colors"
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {departments.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Department Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {departments.length}
                </div>
                <div className="text-sm text-gray-500">Total Departments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {departments.reduce(
                    (sum, dept) => sum + dept.total_programs,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-500">Total Programs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {departments.reduce(
                    (sum, dept) => sum + dept.total_courses,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-500">Total Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {departments.reduce(
                    (sum, dept) => sum + dept.total_students,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-500">Total Students</div>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingDepartment ? "Edit Department" : "Add Department"}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., CS, MATH"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Head (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.head_name}
                      onChange={(e) =>
                        setFormData({ ...formData, head_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="is_active"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Active Department
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitting
                      ? "Saving..."
                      : editingDepartment
                      ? "Update"
                      : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentManagement;
