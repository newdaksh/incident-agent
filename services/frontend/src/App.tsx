import { useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.tsx";
import IncidentDetail from "./pages/IncidentDetail.tsx";
import Runbooks from "./pages/Runbooks.tsx";
import Admin from "./pages/Admin.tsx";
import { Toaster } from "react-hot-toast";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard on first load
    if (window.location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Toaster position="top-right" />
      <div className="flex h-screen">
        {/* Sidebar */}
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
              to="/admin"
            >
              Admin
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/runbooks" element={<Runbooks />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
