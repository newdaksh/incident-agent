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
    // Check both admin and user session keys
    const adminUser = localStorage.getItem("admin_user");
    const userUser = localStorage.getItem("user_user");
    if (adminUser) {
      setUser({ ...JSON.parse(adminUser), _sessionType: "admin" });
    } else if (userUser) {
      setUser({ ...JSON.parse(userUser), _sessionType: "user" });
    } else {
      setUser(null);
    }
    // Listen for both admin and user storage events
    const onAdminStorage = () => {
      const adminUser = localStorage.getItem("admin_user");
      if (adminUser) {
        setUser({ ...JSON.parse(adminUser), _sessionType: "admin" });
      } else {
        setUser(null);
      }
    };
    const onUserStorage = () => {
      const userUser = localStorage.getItem("user_user");
      if (userUser) {
        setUser({ ...JSON.parse(userUser), _sessionType: "user" });
      } else {
        setUser(null);
      }
    };
    window.addEventListener("admin_storage", onAdminStorage);
    window.addEventListener("user_storage", onUserStorage);
    return () => {
      window.removeEventListener("admin_storage", onAdminStorage);
      window.removeEventListener("user_storage", onUserStorage);
    };
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
        {user && user._sessionType === "admin" && (
          <Route path="/*" element={<AdminLayout />} />
        )}
        {user && user._sessionType === "user" && (
          <Route path="/*" element={<UserLayout />} />
        )}
      </Routes>
    </div>
  );
}

export default App;
