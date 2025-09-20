import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginRegister: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("viewer");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email, password }
        : { name, email, password, role };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      // Check if user is admin based on role or isAdmin flag
      const isAdminUser = data.isAdmin || data.user.role === "admin";

      if (isAdminUser) {
        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("admin_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("admin_storage"));
        navigate("/admin/dashboard");
      } else {
        localStorage.setItem("user_token", data.token);
        localStorage.setItem("user_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("user_storage"));
        navigate("/user/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isLogin ? "Login" : "Register"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
          {!isLogin && (
            <>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="viewer">User</option>
                <option value="admin">Admin</option>
              </select>
            </>
          )}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>
        <button
          className="mt-4 text-blue-600 underline"
          onClick={() => setIsLogin((v) => !v)}
        >
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export default LoginRegister;
