import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Dashboard from "./Dashboard";
import IncidentDetail from "./IncidentDetail";
import Runbooks from "./Runbooks";
import UserDashboard from "./UserDashboard";

const UserLayout: React.FC = () => {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <h1 className="text-xl font-bold mb-6">IncidentAgent</h1>
        <nav className="space-y-2">
          <Link
            className="block px-3 py-2 rounded hover:bg-gray-100"
            to="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="block px-3 py-2 rounded hover:bg-gray-100"
            to="/runbooks"
          >
            Runbooks
          </Link>
          <Link
            className="block px-3 py-2 rounded hover:bg-gray-100"
            to="/user"
          >
            User Panel
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/runbooks" element={<Runbooks />} />
          <Route path="/user" element={<UserDashboard />} />
        </Routes>
      </main>
    </div>
  );
};

export default UserLayout;
