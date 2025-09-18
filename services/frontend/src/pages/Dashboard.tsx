import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  FireIcon,
  UserGroupIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

interface DashboardStats {
  myIncidents: {
    total: number;
    open: number;
    investigating: number;
    resolved: number;
  };
  recentIncidents: Array<{
    _id: string;
    title: string;
    severity: string;
    status: string;
    service: string;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
    read: boolean;
  }>;
  quickStats: {
    avgResolutionTime: number;
    escalationsThisWeek: number;
    runbooksUsed: number;
  };
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      const mockData: DashboardStats = {
        myIncidents: {
          total: 12,
          open: 3,
          investigating: 5,
          resolved: 4,
        },
        recentIncidents: [
          {
            _id: "1",
            title: "API latency spike in payment service",
            severity: "high",
            status: "open",
            service: "payment-api",
            createdAt: "2025-01-17T10:30:00Z",
          },
          {
            _id: "2",
            title: "Database connection timeout",
            severity: "critical",
            status: "investigating",
            service: "user-db",
            createdAt: "2025-01-17T09:15:00Z",
          },
          {
            _id: "3",
            title: "Frontend build failures",
            severity: "medium",
            status: "resolved",
            service: "webapp",
            createdAt: "2025-01-17T08:00:00Z",
          },
        ],
        notifications: [
          {
            id: "1",
            type: "escalation",
            message: "Incident #1234 has been escalated to you",
            createdAt: "2025-01-17T11:00:00Z",
            read: false,
          },
          {
            id: "2",
            type: "sla_breach",
            message: "SLA breach warning for incident #1235",
            createdAt: "2025-01-17T10:45:00Z",
            read: false,
          },
        ],
        quickStats: {
          avgResolutionTime: 45,
          escalationsThisWeek: 2,
          runbooksUsed: 8,
        },
      };

      setStats(mockData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-700";
      case "investigating":
        return "bg-yellow-100 text-yellow-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Overview of your incidents and activities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            aria-label="Select time range"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <Link
            to="/incidents/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Report Incident
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Incidents</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.myIncidents.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.myIncidents.open}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Investigating</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.myIncidents.investigating}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.myIncidents.resolved}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Resolution Time</p>
              <p className="text-xl font-bold text-gray-900">
                {stats?.quickStats.avgResolutionTime}min
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Escalations This Week</p>
              <p className="text-xl font-bold text-gray-900">
                {stats?.quickStats.escalationsThisWeek}
              </p>
            </div>
            <FireIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Runbooks Used</p>
              <p className="text-xl font-bold text-gray-900">
                {stats?.quickStats.runbooksUsed}
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Incidents
              </h2>
              <Link
                to="/incidents"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {stats?.recentIncidents.map((incident) => (
              <Link
                key={incident._id}
                to={`/incidents/${incident._id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {incident.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {incident.service} •{" "}
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        incident.status
                      )}`}
                    >
                      {incident.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Notifications
              </h2>
              <BellIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {stats?.notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              stats?.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 ${!notification.read ? "bg-blue-50" : ""}`}
                >
                  <p className="text-sm text-gray-900">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
