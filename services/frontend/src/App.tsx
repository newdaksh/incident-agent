import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
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
    const onStorage = () => {
      const updated = localStorage.getItem("user");
      setUser(updated ? JSON.parse(updated) : null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
