import { useParams } from "react-router-dom";

function IncidentDetail() {
  const { id } = useParams();

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Incident Detail</h2>
      <p className="text-gray-600">Incident ID: {id}</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="md:col-span-2 p-4 bg-white border rounded">
          <h3 className="font-medium mb-2">Timeline</h3>
          <ul className="space-y-2 text-sm">
            <li>10:02 - Alert received</li>
            <li>10:05 - Triage started</li>
            <li>10:12 - Engaged database team</li>
          </ul>
        </section>
        <aside className="p-4 bg-white border rounded">
          <h3 className="font-medium mb-2">Chat / Agent</h3>
          <p className="text-sm text-gray-500">GenAI chat panel placeholder</p>
        </aside>
      </div>
    </div>
  );
}

export default IncidentDetail;
