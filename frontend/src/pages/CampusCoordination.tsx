import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: "news" | "event" | "alert" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  author: string;
  department: string;
  target_audience: string[];
  event_date?: string;
  event_location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  organizer: string;
  department: string;
  max_attendees?: number;
  registered_count: number;
  is_public: boolean;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  created_at: string;
}

const CampusCoordination: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"announcements" | "events">(
    "announcements"
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalType, setModalType] = useState<"announcement" | "event">(
    "announcement"
  );

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    type: "general" as const,
    priority: "medium" as const,
    target_audience: [] as string[],
    event_date: "",
    event_location: "",
  });

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    max_attendees: "",
    is_public: true,
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === "announcements") {
        const response = await fetch("/api/announcements", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data.announcements || []);
        } else {
          setError("Failed to fetch announcements");
        }
      } else {
        const response = await fetch("/api/events", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        } else {
          setError("Failed to fetch events");
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          target_audience: newAnnouncement.target_audience.join(","),
          is_urgent: newAnnouncement.priority === "high",
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewAnnouncement({
          title: "",
          content: "",
          type: "general",
          priority: "medium",
          target_audience: [],
          event_date: "",
          event_location: "",
        });
        setSuccessMessage("Announcement created successfully!");
        setError(null);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);

        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to create announcement");
        setSuccessMessage(null);
      }
    } catch (error) {
      console.error("Failed to create announcement:", error);
      setError("Failed to create announcement");
      setSuccessMessage(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          event_date: `${newEvent.event_date}T${newEvent.event_time}:00`,
          location: newEvent.location,
          type: "general",
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewEvent({
          title: "",
          description: "",
          event_date: "",
          event_time: "",
          location: "",
          max_attendees: "",
          is_public: true,
        });
        setSuccessMessage("Event created successfully!");
        setError(null);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);

        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to create event");
        setSuccessMessage(null);
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      setError("Failed to create event");
      setSuccessMessage(null);
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "news":
        return "fas fa-newspaper";
      case "event":
        return "fas fa-calendar-alt";
      case "alert":
        return "fas fa-exclamation-triangle";
      default:
        return "fas fa-bullhorn";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campus coordination...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Campus Coordination
              </h1>
              <p className="text-gray-600">
                Manage campus announcements, news, and events
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setModalType("announcement");
                  setShowCreateModal(true);
                }}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <i className="fas fa-bullhorn mr-2"></i>
                New Announcement
              </button>
              <button
                onClick={() => {
                  setModalType("event");
                  setShowCreateModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <i className="fas fa-calendar-plus mr-2"></i>
                New Event
              </button>
            </div>
          </div>
        </div>

        {/* Error and Success Messages */}
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

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("announcements")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "announcements"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="fas fa-bullhorn mr-2"></i>
                Announcements ({announcements.length})
              </button>
              <button
                onClick={() => setActiveTab("events")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "events"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="fas fa-calendar-alt mr-2"></i>
                Events ({events.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === "announcements" ? (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <i
                        className={`${getTypeIcon(
                          announcement.type
                        )} text-primary-600`}
                      ></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {announcement.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                        <span>
                          <i className="fas fa-user mr-1"></i>
                          {announcement.author}
                        </span>
                        <span>
                          <i className="fas fa-building mr-1"></i>
                          {announcement.department}
                        </span>
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          {new Date(
                            announcement.created_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                        announcement.priority
                      )}`}
                    >
                      {announcement.priority.toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        announcement.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {announcement.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{announcement.content}</p>

                {announcement.event_date && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <i className="fas fa-calendar-alt"></i>
                      <span className="font-medium">
                        Event Date:{" "}
                        {new Date(announcement.event_date).toLocaleDateString()}
                      </span>
                      {announcement.event_location && (
                        <>
                          <i className="fas fa-map-marker-alt ml-4"></i>
                          <span>{announcement.event_location}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Target Audience:
                    </span>
                    {announcement.target_audience.map((audience, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {audience}
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                      <i className="fas fa-trash mr-1"></i>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {event.status.toUpperCase()}
                      </span>
                      {event.is_public && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {event.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-calendar mr-2 w-4"></i>
                    <span>
                      {new Date(event.event_date).toLocaleDateString()} at{" "}
                      {event.event_time}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-map-marker-alt mr-2 w-4"></i>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-user mr-2 w-4"></i>
                    <span>
                      {event.organizer} ({event.department})
                    </span>
                  </div>
                  {event.max_attendees && (
                    <div className="flex items-center text-sm text-gray-600">
                      <i className="fas fa-users mr-2 w-4"></i>
                      <span>
                        {event.registered_count} / {event.max_attendees}{" "}
                        registered
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors">
                    <i className="fas fa-eye mr-1"></i>
                    View Details
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {modalType === "announcement"
                    ? "Create New Announcement"
                    : "Create New Event"}
                </h3>

                {modalType === "announcement" ? (
                  <form
                    onSubmit={handleCreateAnnouncement}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={newAnnouncement.title}
                        onChange={(e) =>
                          setNewAnnouncement({
                            ...newAnnouncement,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content
                      </label>
                      <textarea
                        value={newAnnouncement.content}
                        onChange={(e) =>
                          setNewAnnouncement({
                            ...newAnnouncement,
                            content: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={newAnnouncement.priority}
                        onChange={(e) =>
                          setNewAnnouncement({
                            ...newAnnouncement,
                            priority: e.target.value as
                              | "low"
                              | "medium"
                              | "high",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Audience
                      </label>
                      <div className="space-y-2">
                        {["students", "lecturers", "parents", "staff"].map(
                          (audience) => (
                            <label key={audience} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={newAnnouncement.target_audience.includes(
                                  audience
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewAnnouncement({
                                      ...newAnnouncement,
                                      target_audience: [
                                        ...newAnnouncement.target_audience,
                                        audience,
                                      ],
                                    });
                                  } else {
                                    setNewAnnouncement({
                                      ...newAnnouncement,
                                      target_audience:
                                        newAnnouncement.target_audience.filter(
                                          (a) => a !== audience
                                        ),
                                    });
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="capitalize">{audience}</span>
                            </label>
                          )
                        )}
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
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        {submitting ? "Creating..." : "Create Announcement"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Title
                      </label>
                      <input
                        type="text"
                        value={newEvent.title}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newEvent.description}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Date
                        </label>
                        <input
                          type="date"
                          value={newEvent.event_date}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              event_date: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Time
                        </label>
                        <input
                          type="time"
                          value={newEvent.event_time}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              event_time: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={newEvent.location}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, location: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Attendees (Optional)
                      </label>
                      <input
                        type="number"
                        value={newEvent.max_attendees}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            max_attendees: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="1"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_public"
                        checked={newEvent.is_public}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            is_public: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="is_public"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        Public Event
                      </label>
                    </div>

                    {error && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    <div className="flex space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {submitting ? "Creating..." : "Create Event"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusCoordination;
