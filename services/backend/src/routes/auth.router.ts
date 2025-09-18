import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import AuditLog from "../models/audit.model";
import { asyncHandler, createError } from "../middlewares/error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { logger } from "../utils/logger";

const router = express.Router();

// Register new user
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, role = "viewer" } = req.body;

    // Check if user/admin exists
    const Admin = require("../models/admin.model").default;
    let existing;
    if (role === "admin") {
      existing = await Admin.findOne({ email });
    } else {
      existing = await User.findOne({ email });
    }
    if (existing) {
      throw createError(
        role === "admin" ? "Admin already exists" : "User already exists",
        400
      );
    }

    let savedDoc, tokenPayload;
    if (role === "admin") {
      // Create admin
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = new Admin({
        name,
        email,
        password: hashedPassword,
        role,
        permissions: [],
        isActive: true,
      });
      await admin.save();
      savedDoc = admin;
      tokenPayload = { id: admin._id, email: admin.email, role: admin.role };
    } else {
      // Create user
      const user = new User({
        name,
        email,
        password,
        role,
        authProvider: "local",
      });
      await user.save();
      savedDoc = user;
      tokenPayload = { id: user._id, email: user.email, role: user.role };
    }

    const jwtSecret = process.env.JWT_SECRET as string;
    const signOptions: jwt.SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN as any) || "24h",
    };
    // @ts-ignore
    const token = jwt.sign(tokenPayload, jwtSecret, signOptions);

    // Log registration
    await (AuditLog as any).createEntry(
      savedDoc._id.toString(),
      role === "admin" ? "admin_registered" : "user_registered",
      role,
      { email, role, authProvider: "local" },
      { ipAddress: req.ip, userAgent: req.get("User-Agent") }
    );

    logger.info(`New ${role} registered: ${email}`);

    res.status(201).json({
      message: `${
        role.charAt(0).toUpperCase() + role.slice(1)
      } registered successfully`,
      token,
      user: {
        id: savedDoc._id,
        name: savedDoc.name,
        email: savedDoc.email,
        role: savedDoc.role,
      },
    });
  })
);

// Login user
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError("Please provide email and password", 400);
    }

    // Check both User and Admin collections
    const Admin = require("../models/admin.model").default;
    let loginUser: any = null;
    let isAdmin = false;

    // Check in Admin collection FIRST to avoid duplicate email confusion
    const admin = await Admin.findOne({ email }).select("+password");
    if (
      admin &&
      admin.isActive &&
      (await bcrypt.compare(password, admin.password))
    ) {
      loginUser = admin;
      isAdmin = true;
    } else {
      // Then check in User collection
      const user = await User.findOne({ email }).select("+password");
      if (user && (await user.comparePassword(password))) {
        loginUser = user;
        isAdmin = false;
      }
    }

    if (!loginUser) {
      throw createError("Invalid credentials", 401);
    }

    // Update last login for users (admins don't have this field by default)
    if (!isAdmin && loginUser.lastLoginAt !== undefined) {
      loginUser.lastLoginAt = new Date();
      await loginUser.save();
    }

    // Generate JWT token
    const tokenPayload2 = {
      id: loginUser._id,
      email: loginUser.email,
      role: loginUser.role,
    };
    const jwtSecret2 = process.env.JWT_SECRET as string;
    const signOptions2: jwt.SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN as any) || "24h",
    };
    // @ts-ignore
    const token = jwt.sign(tokenPayload2, jwtSecret2, signOptions2);

    // Log login
    await (AuditLog as any).createEntry(
      loginUser._id.toString(),
      isAdmin ? "admin_login" : "user_login",
      loginUser.role,
      { email, loginMethod: "local" },
      { ipAddress: req.ip, userAgent: req.get("User-Agent") }
    );

    logger.info(`${isAdmin ? "Admin" : "User"} logged in: ${email}`);

    const responseUser: any = {
      id: loginUser._id,
      name: loginUser.name,
      email: loginUser.email,
      role: loginUser.role,
    };

    // Add user-specific fields if not admin
    if (!isAdmin) {
      responseUser.onCall = loginUser.onCall;
      responseUser.preferences = loginUser.preferences;
    } else {
      responseUser.permissions = loginUser.permissions;
      responseUser.isActive = loginUser.isActive;
    }

    res.json({
      message: "Login successful",
      token,
      user: responseUser,
      isAdmin: isAdmin,
    });
  })
);

// Get current user profile
router.get(
  "/me",
  authMiddleware,
  requireRole("viewer", "responder", "admin"),
  asyncHandler(async (req, res) => {
    const user = req.user;

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onCall: user.onCall,
        timezone: user.timezone,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt,
      },
    });
  })
);

// Update user profile
router.put(
  "/me",
  authMiddleware,
  requireRole("viewer", "responder", "admin"),
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { name, timezone, preferences } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (timezone) updateData.timezone = timezone;
    if (preferences)
      updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    // Log profile update
    await (AuditLog as any).createEntry(
      userId.toString(),
      "profile_updated",
      "user",
      updateData,
      { ipAddress: req.ip, userAgent: req.get("User-Agent") }
    );

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user!._id,
        name: user!.name,
        email: user!.email,
        role: user!.role,
        onCall: user!.onCall,
        timezone: user!.timezone,
        preferences: user!.preferences,
      },
    });
  })
);

// Change password
router.put(
  "/password",
  authMiddleware,
  requireRole("viewer", "responder", "admin"),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      throw createError("Please provide current and new password", 400);
    }

    const user = await User.findById(userId).select("+password");
    if (!user || !(await user.comparePassword(currentPassword))) {
      throw createError("Current password is incorrect", 400);
    }

    (user as any).password = newPassword;
    await user.save();

    // Log password change
    await (AuditLog as any).createEntry(
      userId.toString(),
      "password_changed",
      "user",
      { method: "self_service" },
      { ipAddress: req.ip, userAgent: req.get("User-Agent") }
    );

    res.json({
      message: "Password changed successfully",
    });
  })
);

// Logout (client-side token invalidation)
router.post(
  "/logout",
  authMiddleware,
  requireRole("viewer", "responder", "admin"),
  asyncHandler(async (req, res) => {
    // Log user logout
    await (AuditLog as any).createEntry(
      req.user._id.toString(),
      "user_logout",
      "user",
      { method: "explicit" },
      { ipAddress: req.ip, userAgent: req.get("User-Agent") }
    );

    logger.info(`User logged out: ${req.user.email}`);

    res.json({
      message: "Logout successful",
    });
  })
);

export default router;
