function Runbooks() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Runbooks</h2>
      <div className="space-y-3">
        <div className="p-4 bg-white border rounded">Restart service</div>
        <div className="p-4 bg-white border rounded">Scale deployment</div>
        <div className="p-4 bg-white border rounded">Purge cache</div>
      </div>
    </div>
  );
}

export default Runbooks;
