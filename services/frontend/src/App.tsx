import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.tsx";
import IncidentDetail from "./pages/IncidentDetail.tsx";
import Runbooks from "./pages/Runbooks.tsx";
import Admin from "./pages/Admin.tsx";
import UserDashboard from "./pages/UserDashboard.tsx";
import { Toaster } from "react-hot-toast";
import LoginRegister from "./pages/LoginRegister.tsx";
import UserLayout from "./pages/UserLayout.tsx";
import AdminLayout from "./pages/AdminLayout.tsx";

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Route protection
  useEffect(() => {
    if (!user && window.location.pathname !== "/login") {
      navigate("/login");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginRegister />} />
        {user && user.role === "admin" && (
          <Route path="/*" element={<AdminLayout />} />
        )}
        {user && user.role !== "admin" && (
          <Route path="/*" element={<UserLayout />} />
        )}
      </Routes>
    </div>
  );
}

export default App;
