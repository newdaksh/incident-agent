import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";

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
  sla?: {
    breached: boolean;
    resolutionDeadline: string;
  };
  botAnalysis?: {
    confidence: number;
    recommendations: string[];
  };
}

function MyIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    filterAndSortIncidents();
  }, [incidents, searchTerm, statusFilter, severityFilter, sortBy, sortOrder]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockIncidents: Incident[] = [
        {
          _id: "1",
          title: "API latency spike in payment service",
          description:
            "Users experiencing slow response times when processing payments",
          service: "payment-api",
          severity: "high",
          status: "investigating",
          assignee: "current-user",
          reporter: "current-user",
          createdAt: "2025-01-17T10:30:00Z",
          updatedAt: "2025-01-17T11:00:00Z",
          sla: {
            breached: false,
            resolutionDeadline: "2025-01-17T14:30:00Z",
          },
          botAnalysis: {
            confidence: 0.85,
            recommendations: [
              "Check database connection pool",
              "Review recent deployments",
            ],
          },
        },
        {
          _id: "2",
          title: "Database connection timeout errors",
          description:
            "Multiple connection timeout errors reported in user database",
          service: "user-db",
          severity: "critical",
          status: "open",
          assignee: "current-user",
          reporter: "john.doe",
          createdAt: "2025-01-17T09:15:00Z",
          updatedAt: "2025-01-17T09:15:00Z",
          sla: {
            breached: true,
            resolutionDeadline: "2025-01-17T10:15:00Z",
          },
        },
        {
          _id: "3",
          title: "Frontend build pipeline failures",
          description: "CI/CD pipeline failing on frontend builds",
          service: "webapp",
          severity: "medium",
          status: "resolved",
          assignee: "current-user",
          reporter: "current-user",
          createdAt: "2025-01-17T08:00:00Z",
          updatedAt: "2025-01-17T08:45:00Z",
        },
      ];

      setIncidents(mockIncidents);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortIncidents = () => {
    let filtered = [...incidents];

    // Apply search filter
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

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (incident) => incident.status === statusFilter
      );
    }

    // Apply severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter(
        (incident) => incident.severity === severityFilter
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        const aValue = new Date(a[sortBy]).getTime();
        const bValue = new Date(b[sortBy]).getTime();
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aValue = a[sortBy as keyof Incident] as string;
      const bValue = b[sortBy as keyof Incident] as string;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    setFilteredIncidents(filtered);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case "investigating":
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case "resolved":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "closed":
        return <CheckCircleIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-700";
      case "investigating":
        return "bg-yellow-100 text-yellow-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      case "closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const deleteIncident = async (incidentId: string) => {
    if (window.confirm("Are you sure you want to delete this incident?")) {
      try {
        // Replace with actual API call
        setIncidents(incidents.filter((i) => i._id !== incidentId));
      } catch (error) {
        console.error("Failed to delete incident:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Incidents</h1>
          <p className="text-gray-600">
            Manage and track your assigned incidents
          </p>
        </div>
        <Link
          to="/incidents/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Report Incident</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  aria-label="Filter by severity"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  aria-label="Sort incidents by"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="updatedAt">Updated Date</option>
                  <option value="title">Title</option>
                  <option value="severity">Severity</option>
                  <option value="status">Status</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  aria-label="Sort order"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg shadow border">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No incidents found
            </h3>
            <p className="text-gray-600 mb-4">
              {incidents.length === 0
                ? "You haven't reported any incidents yet."
                : "No incidents match your current filters."}
            </p>
            <Link
              to="/incidents/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Report First Incident</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredIncidents.map((incident) => (
              <div
                key={incident._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(incident.status)}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {incident.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {incident.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{incident.service}</span>
                          <span>•</span>
                          <span>
                            Created{" "}
                            {new Date(incident.createdAt).toLocaleDateString()}
                          </span>
                          {incident.sla?.breached && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 font-medium">
                                SLA Breached
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 ml-4">
                    {/* Bot Analysis Indicator */}
                    {incident.botAnalysis && (
                      <div className="flex items-center space-x-1 text-sm text-blue-600">
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        <span>
                          {Math.round(incident.botAnalysis.confidence * 100)}%
                        </span>
                      </div>
                    )}

                    {/* Severity Badge */}
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        incident.status
                      )}`}
                    >
                      {incident.status}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/incidents/${incident._id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View incident"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/incidents/${incident._id}/edit`}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Edit incident"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      {incident.reporter === "current-user" && (
                        <button
                          onClick={() => deleteIncident(incident._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete incident"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredIncidents.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredIncidents.length} of {incidents.length} incidents
        </div>
      )}
    </div>
  );
}

export default MyIncidents;
