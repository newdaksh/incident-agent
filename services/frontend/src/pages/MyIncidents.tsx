// ...existing code...
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Incident {
  _id: string;
  title: string;
  description: string;
  service: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "closed";
  assignee: string;
  reporter: string;
  createdAt: string;
  updatedAt: string;
}

function MyIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Only show incidents reported by the user
    const mockIncidents: Incident[] = [
      {
        _id: "1",
        title: "Login issue on mobile app",
        description: "Unable to login from mobile device",
        service: "mobile-app",
        severity: "medium",
        status: "open",
        assignee: "admin",
        reporter: "current-user",
        createdAt: "2025-01-17T10:30:00Z",
        updatedAt: "2025-01-17T11:00:00Z",
      },
      {
        _id: "2",
        title: "Notification not received",
        description: "Did not receive notification for incident update",
        service: "notification-service",
        severity: "low",
        status: "resolved",
        assignee: "admin",
        reporter: "current-user",
        createdAt: "2025-01-16T09:15:00Z",
        updatedAt: "2025-01-16T10:00:00Z",
      },
      {
        _id: "3",
        title: "Profile update failed",
        description: "Error when updating profile information",
        service: "user-profile",
        severity: "high",
        status: "investigating",
        assignee: "admin",
        reporter: "current-user",
        createdAt: "2025-01-15T08:00:00Z",
        updatedAt: "2025-01-15T08:45:00Z",
      },
    ];
    setIncidents(mockIncidents);
  }, []);

  useEffect(() => {
    let filtered = [...incidents];
    if (searchTerm) {
      filtered = filtered.filter(
        (incident) =>
          incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          incident.service.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredIncidents(filtered);
  }, [incidents, searchTerm]);

  const deleteIncident = async (incidentId: string) => {
    if (window.confirm("Are you sure you want to delete this incident?")) {
      setIncidents(incidents.filter((i) => i._id !== incidentId));
    }
  };

  return (
    <div className="space-y-6">
      {/* User Onboarding & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-800 mb-2">
            Your Incident Reports
          </h1>
          <p className="text-gray-700 text-base">
            Track issues you've reported. Get updates from admins and see status
            changes here.
          </p>
          <div className="mt-2 bg-blue-50 border-l-4 border-blue-400 p-3 rounded text-blue-700 text-sm">
            <strong>Tip:</strong> You can report a new issue anytime. Admins
            will review and update the status for you.
          </div>
        </div>
        <Link
          to="/user/incidents/new"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors shadow"
        >
          + Report New Incident
        </Link>
      </div>

      {/* Simple Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search your reported incidents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-lg px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
        />
      </div>

      {/* User Incidents List - Minimal Card Layout */}
      <div className="space-y-6">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-blue-200 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No incidents reported yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start by reporting your first issue. You'll see updates here as
              admins respond.
            </p>
            <Link
              to="/user/incidents/new"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors shadow"
            >
              + Report First Incident
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredIncidents.map((incident) => (
              <div
                key={incident._id}
                className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col gap-2"
              >
                <h3 className="text-lg font-bold text-blue-900 mb-1">
                  {incident.title}
                </h3>
                <p className="text-gray-700 mb-1">{incident.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span className="bg-blue-50 px-2 py-1 rounded">
                    Service: {incident.service}
                  </span>
                  <span>•</span>
                  <span>
                    Reported:{" "}
                    {new Date(incident.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <Link
                    to={`/user/incidents/${incident._id}`}
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    View Details
                  </Link>
                  {incident.reporter === "current-user" && (
                    <button
                      onClick={() => deleteIncident(incident._id)}
                      className="text-red-500 hover:underline text-sm font-medium ml-2"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredIncidents.length > 0 && (
        <div className="text-sm text-blue-700 text-center mt-8">
          Showing {filteredIncidents.length} of {incidents.length} reported
          incidents
        </div>
      )}
    </div>
  );
}

export default MyIncidents;
// ...existing code...
