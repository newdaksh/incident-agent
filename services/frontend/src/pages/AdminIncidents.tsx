import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Mock data for admin incidents
const mockIncidents = [
  {
    id: "INC-1001",
    title: "Database outage",
    status: "Open",
    priority: "High",
    assignedTo: "John Doe",
    reportedBy: "User A",
    createdAt: "2025-09-18",
    team: "Backend",
  },
  {
    id: "INC-1002",
    title: "API latency spike",
    status: "Investigating",
    priority: "Medium",
    assignedTo: "Jane Smith",
    reportedBy: "User B",
    createdAt: "2025-09-17",
    team: "DevOps",
  },
  // ...more mock incidents
];

const statusColors: Record<string, string> = {
  Open: "bg-red-100 text-red-800",
  Investigating: "bg-yellow-100 text-yellow-800",
  Resolved: "bg-green-100 text-green-800",
};

const AdminIncidents: React.FC = () => {
  const [incidents, setIncidents] = useState(mockIncidents);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | "">("");
  const [filterTeam, setFilterTeam] = useState<string | "">("");

  // Filter logic
  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(search.toLowerCase()) ||
      incident.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus
      ? incident.status === filterStatus
      : true;
    const matchesTeam = filterTeam ? incident.team === filterTeam : true;
    return matchesSearch && matchesStatus && matchesTeam;
  });

  // Unique teams for filter dropdown
  const teams = Array.from(new Set(incidents.map((i) => i.team)));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Incident Management</h1>
        <Link
          to="/admin/incidents/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create Incident
        </Link>
      </div>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-1/3"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border px-3 py-2 rounded"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Investigating">Investigating</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="border px-3 py-2 rounded"
          aria-label="Filter by team"
        >
          <option value="">All Teams</option>
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>
      <table className="w-full border rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">ID</th>
            <th className="p-3 text-left">Title</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Priority</th>
            <th className="p-3 text-left">Assigned To</th>
            <th className="p-3 text-left">Team</th>
            <th className="p-3 text-left">Reported By</th>
            <th className="p-3 text-left">Created At</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredIncidents.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center py-8 text-gray-500">
                No incidents found.
              </td>
            </tr>
          ) : (
            filteredIncidents.map((incident) => (
              <tr key={incident.id} className="border-b">
                <td className="p-3 font-mono">{incident.id}</td>
                <td className="p-3">{incident.title}</td>
                <td
                  className={`p-3 font-semibold rounded ${
                    statusColors[incident.status] || ""
                  }`}
                >
                  {incident.status}
                </td>
                <td className="p-3">{incident.priority}</td>
                <td className="p-3">{incident.assignedTo}</td>
                <td className="p-3">{incident.team}</td>
                <td className="p-3">{incident.reportedBy}</td>
                <td className="p-3">{incident.createdAt}</td>
                <td className="p-3">
                  <Link
                    to={`/admin/incidents/${incident.id}`}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    View
                  </Link>
                  <button className="text-red-600 hover:underline mr-2">
                    Delete
                  </button>
                  <button className="text-green-600 hover:underline">
                    Assign
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Analytics summary for admin */}
      <div className="mt-10 grid grid-cols-3 gap-6">
        <div className="bg-white border rounded p-6 shadow">
          <h2 className="text-lg font-bold mb-2">Total Incidents</h2>
          <p className="text-3xl font-mono">{incidents.length}</p>
        </div>
        <div className="bg-white border rounded p-6 shadow">
          <h2 className="text-lg font-bold mb-2">Open Incidents</h2>
          <p className="text-3xl font-mono">
            {incidents.filter((i) => i.status === "Open").length}
          </p>
        </div>
        <div className="bg-white border rounded p-6 shadow">
          <h2 className="text-lg font-bold mb-2">Teams Involved</h2>
          <p className="text-3xl font-mono">{teams.length}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminIncidents;
