import React from "react";

const AdminReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Incident & SLA Reports
        </h1>
        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          Reports Center
        </span>
      </div>
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Downloadable Reports
        </h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>
            <span className="font-medium">Weekly Incident Summary</span> —{" "}
            <button className="bg-blue-600 text-white px-3 py-1 rounded ml-2">
              Download PDF
            </button>
          </li>
          <li>
            <span className="font-medium">SLA Compliance Report</span> —{" "}
            <button className="bg-green-600 text-white px-3 py-1 rounded ml-2">
              Download PDF
            </button>
          </li>
          <li>
            <span className="font-medium">User Activity Log</span> —{" "}
            <button className="bg-gray-600 text-white px-3 py-1 rounded ml-2">
              Download PDF
            </button>
          </li>
        </ul>
      </div>
      <div className="bg-white rounded-lg shadow border p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Generated Reports
        </h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Report Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Generated On
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-2">Incident Summary (Week 37)</td>
              <td className="px-4 py-2">2025-09-18</td>
              <td className="px-4 py-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Ready
                </span>
              </td>
              <td className="px-4 py-2">
                <button className="bg-blue-600 text-white px-3 py-1 rounded">
                  Download
                </button>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">SLA Compliance (Q3)</td>
              <td className="px-4 py-2">2025-09-15</td>
              <td className="px-4 py-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  Processing
                </span>
              </td>
              <td className="px-4 py-2">
                <button
                  className="bg-gray-400 text-white px-3 py-1 rounded"
                  disabled
                >
                  Download
                </button>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">User Activity Log</td>
              <td className="px-4 py-2">2025-09-10</td>
              <td className="px-4 py-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Ready
                </span>
              </td>
              <td className="px-4 py-2">
                <button className="bg-blue-600 text-white px-3 py-1 rounded">
                  Download
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-lg shadow border p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Report Generation
        </h2>
        <form className="space-y-4 max-w-lg">
          <div>
            <label
              htmlFor="report-type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Report Type
            </label>
            <select
              id="report-type"
              className="w-full px-3 py-2 border rounded"
              title="Report Type"
            >
              <option>Incident Summary</option>
              <option>SLA Compliance</option>
              <option>User Activity</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="date-range"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date Range
            </label>
            <input
              id="date-range"
              type="text"
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. 2025-09-01 to 2025-09-18"
              title="Date Range"
            />
          </div>
          <button
            type="submit"
            className="bg-purple-600 text-white px-4 py-2 rounded font-medium"
          >
            Generate Report
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminReports;
