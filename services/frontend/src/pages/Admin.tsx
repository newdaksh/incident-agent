function Admin() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Admin</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white border rounded">
          <h3 className="font-medium mb-2">Users</h3>
          <p className="text-sm text-gray-500">Manage roles, SSO and access</p>
        </div>
        <div className="p-4 bg-white border rounded">
          <h3 className="font-medium mb-2">Integrations</h3>
          <p className="text-sm text-gray-500">Slack, PagerDuty, Jira, etc.</p>
        </div>
      </div>
    </div>
  );
}

export default Admin;
