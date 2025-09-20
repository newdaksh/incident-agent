import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AdminDashboard from "./AdminDashboard";
import IncidentDetail from "./IncidentDetail";
import AdminRunbooks from "./AdminRunbooks";
import Admin from "./Admin";
import AdminIncidents from "./AdminIncidents";
import AdminAnalytics from "./AdminAnalytics";
import AdminSettings from "./AdminSettings";
import AdminReports from "./AdminReports";

const navLinks = [
  {
    section: "Main",
    links: [
      {
        to: "/admin/dashboard",
        icon: "",
        color: "text-blue-600",
        label: "Dashboard",
      },
    ],
  },
  {
    section: "Incident Management",
    links: [
      {
        to: "/admin/incidents",
        icon: "",
        color: "text-red-600",
        label: "Incidents",
      },
      {
        to: "/admin/runbooks",
        icon: "",
        color: "text-green-600",
        label: "Runbooks",
      },
      {
        to: "/admin/analytics",
        icon: "",
        color: "text-purple-600",
        label: "Analytics",
      },
      {
        to: "/admin/reports",
        icon: "",
        color: "text-gray-600",
        label: "Reports",
      },
    ],
  },
  {
    section: "Management",
    links: [
      {
        to: "/admin/users",
        icon: "",
        color: "text-indigo-600",
        label: "Users",
      },
      {
        to: "/admin/settings",
        icon: "",
        color: "text-gray-600",
        label: "Settings",
      },
    ],
  },
];

const sidebarVariants = {
  hidden: { x: -80, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 80, damping: 18 },
  },
};

const mainVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3 } },
};

const AdminLayout: React.FC = () => {
  const location = useLocation();
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-white">
      <motion.aside
        initial="hidden"
        animate="visible"
        variants={sidebarVariants}
        className="w-72 bg-white/90 border-r border-gray-200 p-6 shadow-xl backdrop-blur-lg z-10 flex flex-col justify-between"
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-2xl font-extrabold mb-8 text-blue-700 tracking-tight drop-shadow"
          >
            IncidentAgent Admin
          </motion.h1>
          <nav className="space-y-8">
            {navLinks.map((section, idx) => (
              <div key={section.section}>
                <h2 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                  {section.section}
                </h2>
                <div className="space-y-2">
                  {section.links.map((link) => (
                    <motion.div
                      key={link.to}
                      whileHover={{ scale: 1.05, x: 6 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Link
                        className="flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                        to={link.to}
                        style={{
                          boxShadow:
                            location.pathname === link.to
                              ? "0 2px 12px 0 rgba(59,130,246,0.08)"
                              : undefined,
                          background:
                            location.pathname === link.to
                              ? "linear-gradient(90deg, #e0e7ff 0%, #f0f9ff 100%)"
                              : undefined,
                        }}
                      >
                        <span
                          className={`material-icons mr-3 text-xl ${link.color} drop-shadow-sm`}
                        >
                          {link.icon}
                        </span>
                        <span className="tracking-wide text-base">
                          {link.label}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-xs text-gray-400 text-center mt-8"
        >
          &copy; {new Date().getFullYear()} Octal IT | Powered by IncidentAgent
        </motion.div>
      </motion.aside>
      <main className="flex-1 p-8 overflow-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mainVariants}
            className="h-full"
          >
            <Routes location={location}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/incidents" element={<AdminIncidents />} />
              <Route path="/admin/incidents/:id" element={<IncidentDetail />} />
              <Route path="/admin/runbooks" element={<AdminRunbooks />} />
              <Route path="/admin/users" element={<Admin />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              {/* Default redirect to dashboard */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/" element={<AdminDashboard />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminLayout;
