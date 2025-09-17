import { Link } from "react-router-dom";

function Dashboard() {
  // Placeholder incidents list
  const incidents = [
    { _id: "1", title: "API latency spike", severity: "high", status: "open" },
    {
      _id: "2",
      title: "DB connection errors",
      severity: "critical",
      status: "investigating",
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incidents.map((i) => (
          <Link
            key={i._id}
            to={`/incidents/${i._id}`}
            className="block p-4 bg-white rounded border hover:shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{i.title}</p>
                <p className="text-sm text-gray-500">Status: {i.status}</p>
              </div>
              <span className="text-xs uppercase px-2 py-1 rounded bg-red-100 text-red-700">
                {i.severity}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
