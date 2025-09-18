import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import IncidentDetail from "./IncidentDetail";
import Runbooks from "./Runbooks";
import Admin from "./Admin";
import MyIncidents from "./MyIncidents";

const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <h1 className="text-xl font-bold mb-6">IncidentAgent Admin</h1>
        <nav className="space-y-4">
          {/* Main Section */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Main
            </h2>
            <Link
              className="flex items-center px-3 py-2 rounded hover:bg-gray-100"
              to="/admin/dashboard"
            >
              <span className="material-icons mr-2 text-blue-600">
                dashboard
              </span>
              Dashboard
            </Link>
          </div>
          {/* Incident Management */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Incident Management
            </h2>
            <Link
              className="flex items-center px-3 py-2 rounded hover:bg-gray-100"
              to="/admin/incidents"
            >
              <span className="material-icons mr-2 text-red-600">
                report_problem
              </span>
              Incidents
            </Link>
            <Link
              className="flex items-center px-3 py-2 rounded hover:bg-gray-100"
              to="/admin/runbooks"
            >
              <span className="material-icons mr-2 text-green-600">
                menu_book
              </span>
              Runbooks
            </Link>
            <Link
              className="flex items-center px-3 py-2 rounded hover:bg-gray-100"
              to="/admin/analytics"
            >
              <span className="material-icons mr-2 text-purple-600">
                analytics
              </span>
              Analytics
            </Link>
            <Link
              className="flex items-center px-3 py-2 rounded hover:bg-gray-100"
              to="/admin/reports"
            >
              <span className="material-icons mr-2 text-gray-600">
                description
              </span>
              Reports
            </Link>
          </div>
          {/* User & System Management */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Management
            </h2>
            <Link
              className="flex items-center px-3 py-2 rounded hover:bg-gray-100"
              to="/admin/users"
            >
              <span className="material-icons mr-2 text-indigo-600">group</span>
              Users
            </Link>
            <Link
              className="flex items-center px-3 py-2 rounded hover:bg-gray-100"
              to="/admin/settings"
            >
              <span className="material-icons mr-2 text-gray-600">
                settings
              </span>
              Settings
            </Link>
          </div>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/incidents" element={<MyIncidents />} />
          <Route path="/admin/incidents/:id" element={<IncidentDetail />} />
          <Route path="/admin/runbooks" element={<Runbooks />} />
          <Route path="/admin/users" element={<Admin />} />
          <Route path="/admin/analytics" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminDashboard />} />
          {/* Default redirect to dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/" element={<AdminDashboard />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminLayout;
