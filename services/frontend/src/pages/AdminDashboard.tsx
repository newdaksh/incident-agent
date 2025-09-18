import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

interface AdminDashboardData {
  globalStats: {
    totalIncidents: number;
    openIncidents: number;
    resolvedToday: number;
    slaCompliance: number;
    avgMTTR: number;
    activeUsers: number;
  };
  trends: {
    incidentTrend: "up" | "down" | "stable";
    incidentChange: number;
    mttrTrend: "up" | "down" | "stable";
    mttrChange: number;
  };
  hotspots: Array<{
    service: string;
    incidents: number;
    trend: "up" | "down" | "stable";
    change: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "incident_created" | "runbook_approved" | "user_added" | "sla_breach";
    description: string;
    timestamp: string;
    severity?: string;
  }>;
  teamPerformance: Array<{
    userId: string;
    userName: string;
    assignedIncidents: number;
    resolvedIncidents: number;
    avgResolutionTime: number;
    resolutionRate: number;
  }>;
}

function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      const mockData: AdminDashboardData = {
        globalStats: {
          totalIncidents: 1247,
          openIncidents: 23,
          resolvedToday: 15,
          slaCompliance: 94.2,
          avgMTTR: 42,
          activeUsers: 156,
        },
        trends: {
          incidentTrend: "down",
          incidentChange: -12.5,
          mttrTrend: "down",
          mttrChange: -8.3,
        },
        hotspots: [
          { service: "payment-api", incidents: 12, trend: "up", change: 25 },
          {
            service: "user-database",
            incidents: 8,
            trend: "stable",
            change: 0,
          },
          {
            service: "notification-service",
            incidents: 6,
            trend: "down",
            change: -15,
          },
        ],
        recentActivity: [
          {
            id: "1",
            type: "sla_breach",
            description: "SLA breached for payment-api incident #1234",
            timestamp: "2025-01-17T11:30:00Z",
            severity: "high",
          },
          {
            id: "2",
            type: "runbook_approved",
            description: "Database troubleshooting runbook approved by admin",
            timestamp: "2025-01-17T10:45:00Z",
          },
          {
            id: "3",
            type: "incident_created",
            description: "Critical incident reported in user-database",
            timestamp: "2025-01-17T10:15:00Z",
            severity: "critical",
          },
        ],
        teamPerformance: [
          {
            userId: "1",
            userName: "Sarah Johnson",
            assignedIncidents: 15,
            resolvedIncidents: 13,
            avgResolutionTime: 35,
            resolutionRate: 86.7,
          },
          {
            userId: "2",
            userName: "Mike Chen",
            assignedIncidents: 12,
            resolvedIncidents: 11,
            avgResolutionTime: 28,
            resolutionRate: 91.7,
          },
          {
            userId: "3",
            userName: "Emily Rodriguez",
            assignedIncidents: 18,
            resolvedIncidents: 14,
            avgResolutionTime: 45,
            resolutionRate: 77.8,
          },
        ],
      };

      setData(mockData);
    } catch (error) {
      console.error("Failed to fetch admin dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />;
      case "down":
        return <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />;
      case "stable":
        return <MinusIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (
    trend: "up" | "down" | "stable",
    isGoodWhenDown = true
  ) => {
    if (trend === "stable") return "text-gray-500";
    if (isGoodWhenDown) {
      return trend === "down" ? "text-green-500" : "text-red-500";
    } else {
      return trend === "up" ? "text-green-500" : "text-red-500";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "incident_created":
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case "runbook_approved":
        return <DocumentTextIcon className="h-4 w-4 text-green-500" />;
      case "user_added":
        return <UserGroupIcon className="h-4 w-4 text-blue-500" />;
      case "sla_breach":
        return <ClockIcon className="h-4 w-4 text-orange-500" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-gray-500" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            System-wide overview and management controls
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            aria-label="Select time range"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <Link
            to="/admin/reports"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Generate Report
          </Link>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Incidents</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.globalStats.totalIncidents}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            {getTrendIcon(data?.trends.incidentTrend || "stable")}
            <span
              className={`ml-1 ${getTrendColor(
                data?.trends.incidentTrend || "stable"
              )}`}
            >
              {Math.abs(data?.trends.incidentChange || 0)}%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.globalStats.openIncidents}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.globalStats.resolvedToday}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">SLA Compliance</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.globalStats.slaCompliance}%
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg MTTR</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.globalStats.avgMTTR}min
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            {getTrendIcon(data?.trends.mttrTrend || "stable")}
            <span
              className={`ml-1 ${getTrendColor(
                data?.trends.mttrTrend || "stable"
              )}`}
            >
              {Math.abs(data?.trends.mttrChange || 0)}%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.globalStats.activeUsers}
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Hotspots */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FireIcon className="h-5 w-5 text-red-500 mr-2" />
                Service Hotspots
              </h2>
              <Link
                to="/admin/analytics"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {data?.hotspots.map((hotspot, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {hotspot.service}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {hotspot.incidents} incidents
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(hotspot.trend)}
                    <span
                      className={`text-sm ${getTrendColor(
                        hotspot.trend,
                        false
                      )}`}
                    >
                      {hotspot.change !== 0
                        ? `${hotspot.change > 0 ? "+" : ""}${hotspot.change}%`
                        : "No change"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {data?.recentActivity.map((activity) => (
              <div key={activity.id} className="p-4">
                <div className="flex items-start space-x-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Team Performance
              </h2>
              <Link
                to="/admin/users"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Manage Users
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {data?.teamPerformance.map((member) => (
              <div key={member.userId} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {member.userName}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {member.resolvedIncidents}/{member.assignedIncidents}{" "}
                      resolved • {member.avgResolutionTime}min avg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {member.resolutionRate}%
                    </p>
                    <p className="text-xs text-gray-600">Resolution Rate</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/incidents"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Manage Incidents
                </h3>
                <p className="text-xs text-gray-600">
                  View and manage all incidents
                </p>
              </div>
            </Link>

            <Link
              to="/admin/runbooks"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Runbook Management
                </h3>
                <p className="text-xs text-gray-600">
                  Approve and manage runbooks
                </p>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  User Management
                </h3>
                <p className="text-xs text-gray-600">
                  Manage users and permissions
                </p>
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <CogIcon className="h-6 w-6 text-gray-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  System Settings
                </h3>
                <p className="text-xs text-gray-600">
                  Configure system settings
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
