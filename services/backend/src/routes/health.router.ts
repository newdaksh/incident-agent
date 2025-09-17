import express from "express";
import { asyncHandler } from "../middlewares/error.middleware";

const router = express.Router();

// Health check endpoint
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const healthCheck = {
      uptime: process.uptime(),
      message: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
    };

    res.status(200).json(healthCheck);
  })
);

// Detailed health check
router.get(
  "/detailed",
  asyncHandler(async (req, res) => {
    const mongoose = require("mongoose");
    const redis = require("../utils/redis");

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        mongodb: {
          status:
            mongoose.connection.readyState === 1 ? "connected" : "disconnected",
          readyState: mongoose.connection.readyState,
        },
        redis: {
          status: "unknown", // We'll implement this check
        },
        genai: {
          status: "unknown", // We'll implement this check
        },
      },
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development",
    };

    res.status(200).json(health);
  })
);

export default router;
