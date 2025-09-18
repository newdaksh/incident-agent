import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import IncidentDetail from "./IncidentDetail";
import Runbooks from "./Runbooks";
import UserDashboard from "./UserDashboard";
import MyIncidents from "./MyIncidents";
import ChatbotAssistant from "./ChatbotAssistant";

const UserLayout: React.FC = () => {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <h1 className="text-xl font-bold mb-6">IncidentAgent</h1>
        <nav className="space-y-2">
          <Link
            className="block px-3 py-2 rounded hover:bg-gray-100"
            to="/user/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="block px-3 py-2 rounded hover:bg-gray-100"
            to="/user/incidents"
          >
            My Incidents
          </Link>
          <Link
            className="block px-3 py-2 rounded hover:bg-gray-100"
            to="/user/runbooks"
          >
            Runbooks
          </Link>
          <Link
            className="block px-3 py-2 rounded hover:bg-gray-100"
            to="/user/assistant"
          >
            AI Assistant
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/incidents" element={<MyIncidents />} />
          <Route path="/user/incidents/:id" element={<IncidentDetail />} />
          <Route path="/user/runbooks" element={<Runbooks />} />
          <Route path="/user/assistant" element={<ChatbotAssistant />} />
          {/* Default redirect to dashboard */}
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/" element={<UserDashboard />} />
        </Routes>
      </main>
    </div>
  );
};

export default UserLayout;
