const userRunbooks = [
  {
    id: 1,
    title: "Reset My Password",
    description: "Step-by-step guide to reset your account password.",
    action: "Go to Account Settings > Security > Reset Password.",
  },
  {
    id: 2,
    title: "Troubleshoot Login Issues",
    description: "Common fixes for login problems on web and mobile.",
    action: "Check your internet connection, clear browser cache, and retry.",
  },
  {
    id: 3,
    title: "Report a Bug",
    description: "How to report a bug or issue to support.",
    action: "Use the 'Report Incident' button on your dashboard.",
  },
  {
    id: 4,
    title: "Update Profile Information",
    description: "Steps to update your personal details.",
    action: "Navigate to Profile > Edit and save your changes.",
  },
];

function Runbooks() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">My Runbooks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userRunbooks.map((runbook) => (
          <div
            key={runbook.id}
            className="bg-white border rounded-lg p-6 shadow"
          >
            <h3 className="text-lg font-bold mb-2 text-blue-700">
              {runbook.title}
            </h3>
            <p className="text-gray-600 mb-2">{runbook.description}</p>
            <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm font-medium">
              {runbook.action}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <a
          href="/user/incidents/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Report an Issue
        </a>
      </div>
    </div>
  );
}

export default Runbooks;
