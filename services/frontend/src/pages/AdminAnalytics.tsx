import React from "react";

const AdminAnalytics: React.FC = () => {
  // Example analytics data (replace with API integration as needed)
  const stats = {
    totalIncidents: 1247,
    avgResolutionTime: 42,
    slaCompliance: 94.2,
    activeUsers: 156,
    incidentTrend: "down",
    mttrTrend: "up",
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          System Insights
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Total Incidents</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalIncidents}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Avg Resolution Time</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.avgResolutionTime} min
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <p className="text-sm text-gray-600">SLA Compliance</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.slaCompliance}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Active Users</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.activeUsers}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow border p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Trends & Charts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-md font-medium text-blue-800 mb-2">
              Incident Trend
            </h3>
            <p className="text-2xl font-bold text-blue-900">
              {stats.incidentTrend === "down" ? "↓" : "↑"}
            </p>
            <p className="text-sm text-gray-600">Compared to last period</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-md font-medium text-green-800 mb-2">
              MTTR Trend
            </h3>
            <p className="text-2xl font-bold text-green-900">
              {stats.mttrTrend === "up" ? "↑" : "↓"}
            </p>
            <p className="text-sm text-gray-600">Mean Time To Resolution</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow border p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Analytics Reports
        </h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Incident volume decreased by 12% this week</li>
          <li>MTTR increased by 8% due to critical outages</li>
          <li>SLA compliance remains above 90%</li>
          <li>Active user count stable</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminAnalytics;
