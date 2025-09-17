import React from "react";

const UserDashboard: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
      <p>
        Welcome to your dashboard. Here you can view your incidents, runbooks,
        and more.
      </p>
      {/* Add more user-specific features here */}
    </div>
  );
};

export default UserDashboard;
