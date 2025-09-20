import React from "react";

const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
          Configuration
        </span>
      </div>
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          General Configuration
        </h2>
        <form className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded"
              defaultValue="IncidentAgent"
              title="System Name"
              placeholder="System Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default SLA Policy
            </label>
            <label
              htmlFor="sla-policy"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              SLA Policy
            </label>
            <select
              id="sla-policy"
              className="w-full px-3 py-2 border rounded"
              title="Default SLA Policy"
            >
              <option>Standard (24h)</option>
              <option>Critical (4h)</option>
              <option>Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded"
              defaultValue="admin@incidentagent.com"
              title="Notification Email"
              placeholder="Notification Email"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium"
          >
            Save Settings
          </button>
        </form>
      </div>
      <div className="bg-white rounded-lg shadow border p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          User Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-medium text-gray-800 mb-2">
              Add New User
            </h3>
            <form className="space-y-2">
              <label
                htmlFor="add-user-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="add-user-name"
                type="text"
                placeholder="Name"
                className="w-full px-3 py-2 border rounded"
                title="User Name"
              />
              <label
                htmlFor="add-user-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="add-user-email"
                type="email"
                placeholder="Email"
                className="w-full px-3 py-2 border rounded"
                title="User Email"
              />
              <label
                htmlFor="add-user-role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role
              </label>
              <select
                id="add-user-role"
                className="w-full px-3 py-2 border rounded"
                title="User Role"
              >
                <option value="viewer">Viewer</option>
                <option value="responder">Responder</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                className="bg-green-600 text-white px-3 py-1 rounded font-medium"
              >
                Add User
              </button>
            </form>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-medium text-gray-800 mb-2">
              Manage Existing Users
            </h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Sarah Johnson (Admin)</li>
              <li>Mike Chen (Responder)</li>
              <li>Emily Rodriguez (Viewer)</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow border p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Preferences
        </h2>
        <form className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <label
              htmlFor="theme-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Theme
            </label>
            <select
              id="theme-select"
              className="w-full px-3 py-2 border rounded"
              title="Theme"
            >
              <option>Light</option>
              <option>Dark</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <label
              htmlFor="language-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Language
            </label>
            <select
              id="language-select"
              className="w-full px-3 py-2 border rounded"
              title="Language"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium"
          >
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
