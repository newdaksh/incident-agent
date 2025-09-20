import React from "react";

const mockStats = {
  myIncidents: 3,
  openIncidents: 2,
  runbooks: 5,
};

const UserDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">
            Your personalized dashboard for incidents and runbooks
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">My Incidents</p>
            <p className="text-2xl font-bold text-gray-900">
              {mockStats.myIncidents}
            </p>
          </div>
          <span className="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
            Open: {mockStats.openIncidents}
          </span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">My Runbooks</p>
            <p className="text-2xl font-bold text-gray-900">
              {mockStats.runbooks}
            </p>
          </div>
          <span className="inline-block bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
            Available
          </span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">AI Assistant</p>
            <p className="text-2xl font-bold text-gray-900">Ready</p>
          </div>
          <span className="inline-block bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
            Ask Anything
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/user/incidents"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <span className="bg-blue-100 text-blue-600 rounded-full p-2">
              📄
            </span>
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                View My Incidents
              </h3>
              <p className="text-xs text-gray-600">
                Track and manage your incidents
              </p>
            </div>
          </a>
          <a
            href="/user/runbooks"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <span className="bg-green-100 text-green-600 rounded-full p-2">
              📚
            </span>
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Browse Runbooks
              </h3>
              <p className="text-xs text-gray-600">
                Access helpful guides and actions
              </p>
            </div>
          </a>
          <a
            href="/user/assistant"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <span className="bg-purple-100 text-purple-600 rounded-full p-2">
              🤖
            </span>
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Ask AI Assistant
              </h3>
              <p className="text-xs text-gray-600">
                Get instant help and answers
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
