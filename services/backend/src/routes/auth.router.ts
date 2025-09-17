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

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError("User already exists", 400);
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role,
      authProvider: "local",
    });

    await user.save();

    // Generate JWT token
    const tokenPayload = { id: user._id, email: user.email, role: user.role };
    const jwtSecret = process.env.JWT_SECRET as string;
    const signOptions: jwt.SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN as any) || "24h",
    };
    // @ts-ignore
    const token = jwt.sign(tokenPayload, jwtSecret, signOptions);

    // Log user registration
    await (AuditLog as any).createEntry(
      user._id.toString(),
      "user_registered",
      "user",
      { email, role, authProvider: "local" },
      { ipAddress: req.ip, userAgent: req.get("User-Agent") }
    );

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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

    // Find user and include password
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      throw createError("Invalid credentials", 401);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const tokenPayload2 = { id: user._id, email: user.email, role: user.role };
    const jwtSecret2 = process.env.JWT_SECRET as string;
    const signOptions2: jwt.SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN as any) || "24h",
    };
    // @ts-ignore
    const token = jwt.sign(tokenPayload2, jwtSecret2, signOptions2);

    // Log user login
    await (AuditLog as any).createEntry(
      user._id.toString(),
      "user_login",
      "user",
      { email, loginMethod: "local" },
      { ipAddress: req.ip, userAgent: req.get("User-Agent") }
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onCall: user.onCall,
        preferences: user.preferences,
      },
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
