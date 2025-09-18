import express from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { requireAuth, requireAdmin } from "../middlewares/rbac.middleware";
import User from "../models/user.model";
import AuditLog from "../models/audit.model";
import { logger } from "../utils/logger";
import bcrypt from "bcryptjs";

const router = express.Router();

// GET /api/users - List users with filtering
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const {
      search,
      role,
      department,
      onCall,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filters: any = {};

    if (role) {
      filters.role = role;
    }

    if (department) {
      filters.department = department;
    }

    if (onCall !== undefined) {
      filters.onCall = onCall === "true";
    }

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const users = await User.find(filters)
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select("-password");

    const total = await User.countDocuments(filters);

    res.json({
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  })
);

// GET /api/users/:id - Get user details
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow users to see their own details unless admin
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(user);
  })
);

// POST /api/users - Create new user (Admin only)
router.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      password,
      role,
      department,
      teams,
      skillTags,
      permissions,
      timezone,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || "viewer",
      department,
      teams: teams || [],
      skillTags: skillTags || [],
      permissions: permissions || getDefaultPermissions(role || "viewer"),
      timezone: timezone || "UTC",
    });

    await user.save();

    // Create audit log
    await AuditLog.create({
      action: "user.created",
      userId: req.user._id,
      targetType: "user",
      targetId: user._id,
      details: `Created user: ${user.name} (${user.email})`,
    });

    logger.info(`User created: ${user.name}`, {
      userId: user._id,
      createdBy: req.user._id,
      role: user.role,
    });

    res.status(201).json(user);
  })
);

// PUT /api/users/:id - Update user
router.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow users to update their own profile unless admin
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      name,
      email,
      role,
      department,
      teams,
      skillTags,
      permissions,
      timezone,
      onCall,
      preferences,
    } = req.body;

    // Validate admin-only fields
    if (req.user.role !== "admin") {
      if (role || permissions) {
        return res
          .status(403)
          .json({ message: "Only admins can update role and permissions" });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (timezone) user.timezone = timezone;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    // Admin-only fields
    if (req.user.role === "admin") {
      if (role) user.role = role;
      if (department) user.department = department;
      if (teams) user.teams = teams;
      if (skillTags) user.skillTags = skillTags;
      if (permissions) user.permissions = permissions;
      if (onCall !== undefined) user.onCall = onCall;
    }

    await user.save();

    // Create audit log
    await AuditLog.create({
      action: "user.updated",
      userId: req.user._id,
      targetType: "user",
      targetId: user._id,
      details: `Updated user: ${user.name}`,
    });

    res.json(user);
  })
);

// PUT /api/users/:id/password - Change user password
router.put(
  "/:id/password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow users to change their own password unless admin
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // For non-admin users, verify current password
    if (req.user.role !== "admin") {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: "Current password is required" });
      }

      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
    }

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    user.password = newPassword;
    await user.save();

    // Create audit log
    await AuditLog.create({
      action: "user.password_changed",
      userId: req.user._id,
      targetType: "user",
      targetId: user._id,
      details: `Password changed for user: ${user.name}`,
    });

    res.json({ message: "Password updated successfully" });
  })
);

// PUT /api/users/:id/role - Update user role (Admin only)
router.put(
  "/:id/role",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validRoles = ["viewer", "responder", "admin", "manager"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const oldRole = user.role;
    user.role = role;
    user.permissions = getDefaultPermissions(role);

    await user.save();

    // Create audit log
    await AuditLog.create({
      action: "user.role_changed",
      userId: req.user._id,
      targetType: "user",
      targetId: user._id,
      details: `Changed user role from ${oldRole} to ${role} for: ${user.name}`,
    });

    res.json(user);
  })
);

// PUT /api/users/:id/on-call - Toggle on-call status
router.put(
  "/:id/on-call",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { onCall } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Allow users to set themselves on-call, or admins to set anyone
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    user.onCall = onCall;
    await user.save();

    // Create audit log
    await AuditLog.create({
      action: "user.on_call_changed",
      userId: req.user._id,
      targetType: "user",
      targetId: user._id,
      details: `Changed on-call status to ${onCall} for: ${user.name}`,
    });

    res.json(user);
  })
);

// GET /api/users/on-call - Get on-call users
router.get(
  "/on-call",
  requireAuth,
  asyncHandler(async (req, res) => {
    const onCallUsers = await User.findOnCall().select("-password");
    res.json(onCallUsers);
  })
);

// GET /api/users/roles/:role - Get users by role
router.get(
  "/roles/:role",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { role } = req.params;
    const users = await User.findByRole(role).select("-password");
    res.json(users);
  })
);

// GET /api/users/departments - Get all departments
router.get(
  "/departments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const departments = await User.distinct("department");
    res.json(departments.filter((dept) => dept)); // Filter out null/undefined
  })
);

// GET /api/users/teams - Get all teams
router.get(
  "/teams",
  requireAuth,
  asyncHandler(async (req, res) => {
    const teams = await User.distinct("teams");
    res.json(teams);
  })
);

// GET /api/users/skill-tags - Get all skill tags
router.get(
  "/skill-tags",
  requireAuth,
  asyncHandler(async (req, res) => {
    const skillTags = await User.distinct("skillTags");
    res.json(skillTags);
  })
);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.id);

    // Create audit log
    await AuditLog.create({
      action: "user.deleted",
      userId: req.user._id,
      targetType: "user",
      targetId: user._id,
      details: `Deleted user: ${user.name} (${user.email})`,
    });

    logger.info(`User deleted: ${user.name}`, {
      userId: user._id,
      deletedBy: req.user._id,
    });

    res.json({ message: "User deleted successfully" });
  })
);

// Helper function to get default permissions for role
function getDefaultPermissions(role: string): string[] {
  const permissionSets = {
    viewer: ["incidents.read", "runbooks.read", "chatbot.interact"],
    responder: [
      "incidents.read",
      "incidents.create",
      "incidents.update",
      "runbooks.read",
      "runbooks.create",
      "chatbot.interact",
      "rca.generate",
    ],
    manager: [
      "incidents.read",
      "incidents.create",
      "incidents.update",
      "runbooks.read",
      "runbooks.create",
      "runbooks.update",
      "analytics.read",
      "analytics.export",
      "chatbot.interact",
      "rca.generate",
    ],
    admin: [
      "incidents.read",
      "incidents.create",
      "incidents.update",
      "incidents.delete",
      "runbooks.read",
      "runbooks.create",
      "runbooks.update",
      "runbooks.delete",
      "runbooks.approve",
      "users.read",
      "users.create",
      "users.update",
      "users.delete",
      "analytics.read",
      "analytics.export",
      "integrations.manage",
      "sla.manage",
      "chatbot.interact",
      "rca.generate",
    ],
  };

  return (
    permissionSets[role as keyof typeof permissionSets] || permissionSets.viewer
  );
}

export default router;
