import React, { useState } from "react";
import { Link } from "react-router-dom";

// Mock data for admin runbooks
const mockRunbooks = [
  {
    id: "RB-001",
    title: "Database Recovery",
    status: "Active",
    owner: "John Doe",
    createdAt: "2025-09-10",
    steps: 8,
    assignedTeams: ["Backend", "DevOps"],
  },
  {
    id: "RB-002",
    title: "API Latency Troubleshooting",
    status: "Draft",
    owner: "Jane Smith",
    createdAt: "2025-09-12",
    steps: 5,
    assignedTeams: ["DevOps"],
  },
  // ...more mock runbooks
];

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Draft: "bg-yellow-100 text-yellow-800",
  Archived: "bg-gray-100 text-gray-800",
};

const AdminRunbooks: React.FC = () => {
  const [runbooks, setRunbooks] = useState(mockRunbooks);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | "">("");

  // Filter logic
  const filteredRunbooks = runbooks.filter((runbook) => {
    const matchesSearch =
      runbook.title.toLowerCase().includes(search.toLowerCase()) ||
      runbook.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus ? runbook.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Runbook Management</h1>
        <Link
          to="/admin/runbooks/new"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Create Runbook
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
          title="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>
      </div>
      <table className="w-full border rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">ID</th>
            <th className="p-3 text-left">Title</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Owner</th>
            <th className="p-3 text-left">Created At</th>
            <th className="p-3 text-left">Steps</th>
            <th className="p-3 text-left">Teams</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRunbooks.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-8 text-gray-500">
                No runbooks found.
              </td>
            </tr>
          ) : (
            filteredRunbooks.map((runbook) => (
              <tr key={runbook.id} className="border-b">
                <td className="p-3 font-mono">{runbook.id}</td>
                <td className="p-3">{runbook.title}</td>
                <td
                  className={`p-3 font-semibold rounded ${
                    statusColors[runbook.status] || ""
                  }`}
                >
                  {runbook.status}
                </td>
                <td className="p-3">{runbook.owner}</td>
                <td className="p-3">{runbook.createdAt}</td>
                <td className="p-3">{runbook.steps}</td>
                <td className="p-3">{runbook.assignedTeams.join(", ")}</td>
                <td className="p-3">
                  <Link
                    to={`/admin/runbooks/${runbook.id}`}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    View
                  </Link>
                  <button className="text-yellow-600 hover:underline mr-2">
                    Edit
                  </button>
                  <button className="text-red-600 hover:underline">
                    Delete
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
          <h2 className="text-lg font-bold mb-2">Total Runbooks</h2>
          <p className="text-3xl font-mono">{runbooks.length}</p>
        </div>
        <div className="bg-white border rounded p-6 shadow">
          <h2 className="text-lg font-bold mb-2">Active Runbooks</h2>
          <p className="text-3xl font-mono">
            {runbooks.filter((r) => r.status === "Active").length}
          </p>
        </div>
        <div className="bg-white border rounded p-6 shadow">
          <h2 className="text-lg font-bold mb-2">Teams Involved</h2>
          <p className="text-3xl font-mono">
            {
              Array.from(new Set(runbooks.flatMap((r) => r.assignedTeams)))
                .length
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRunbooks;
