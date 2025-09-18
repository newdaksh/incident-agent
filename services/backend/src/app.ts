import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";

import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { authMiddleware } from "./middlewares/auth.middleware";

// Route imports
import incidentsRouter from "./routes/incidents.router";
import authRouter from "./routes/auth.router";
import webhooksRouter from "./routes/webhooks.router";
import healthRouter from "./routes/health.router";
import analyticsRouter from "./routes/analytics.router";
import runbooksRouter from "./routes/runbooks.router";
import usersRouter from "./routes/users.router";
import rcaRouter from "./routes/rca.router";
import adminAuthRouter from "./routes/admin-auth.router";
import { setupSocket } from "./sockets/socket";

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

setupSocket(io);

// Trust proxy for accurate client IPs behind reverse proxy
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [
        "http://localhost:3000",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// API-specific rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // More generous for API calls
  message: "Too many API requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook-specific rate limiting
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // High limit for webhooks
  message: "Too many webhook requests from this IP.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use(compression());

// Logging
if (process.env.NODE_ENV === "production") {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
} else {
  app.use(morgan("dev"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check route (no rate limiting)
app.use("/api/health", healthRouter);

// Webhook routes (separate rate limiting)
app.use("/webhooks", webhookLimiter, webhooksRouter);

// API routes (with API-specific rate limiting)
app.use("/api", apiLimiter);

// Authentication routes
app.use("/api/auth", authRouter);
app.use("/api/admin", adminAuthRouter);

// Protected API routes
app.use("/api/incidents", authMiddleware, incidentsRouter);
app.use("/api/analytics", authMiddleware, analyticsRouter);
app.use("/api/runbooks", authMiddleware, runbooksRouter);
app.use("/api/users", authMiddleware, usersRouter);
app.use("/api/rca", authMiddleware, rcaRouter);

// Socket.IO availability for routes
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).io = io;
  next();
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app, server, io };
