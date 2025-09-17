import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { logger } from "../utils/logger";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../types";

export const setupSocket = (
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error("Server configuration error"));
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.data.userId = user._id.toString();
      socket.data.role = user.role;

      logger.info(`Socket authenticated for user: ${user.email}`);
      next();
    } catch (error) {
      logger.error("Socket authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.data.userId} (${socket.data.role})`);

    // Join user to their personal room for targeted notifications
    socket.join(`user:${socket.data.userId}`);

    // Join user to role-based rooms
    socket.join(`role:${socket.data.role}`);

    // Handle joining incident rooms
    socket.on("join_incident", (incidentId) => {
      socket.join(`incident:${incidentId}`);
      logger.info(
        `User ${socket.data.userId} joined incident room: ${incidentId}`
      );
    });

    // Handle leaving incident rooms
    socket.on("leave_incident", (incidentId) => {
      socket.leave(`incident:${incidentId}`);
      logger.info(
        `User ${socket.data.userId} left incident room: ${incidentId}`
      );
    });

    // Handle typing indicators
    socket.on("typing", (incidentId, isTyping) => {
      socket.to(`incident:${incidentId}`).emit("notification", {
        type: "typing",
        message: isTyping ? "User is typing..." : "User stopped typing",
        data: { userId: socket.data.userId, isTyping },
      });
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logger.info(
        `User disconnected: ${socket.data.userId}, reason: ${reason}`
      );
    });

    // Send welcome message
    socket.emit("notification", {
      type: "welcome",
      message: "Connected to IncidentAgent real-time updates",
    });
  });

  // Helper functions to emit events from other parts of the application
  io.emitIncidentCreated = (incident: any) => {
    io.emit("incident.created", incident);
    logger.info(`Broadcast incident created: ${incident._id}`);
  };

  io.emitIncidentUpdated = (incident: any) => {
    io.emit("incident.updated", incident);
    io.to(`incident:${incident._id}`).emit("incident.updated", incident);
    logger.info(`Broadcast incident updated: ${incident._id}`);
  };

  io.emitChatUpdated = (incidentId: string, message: any) => {
    io.to(`incident:${incidentId}`).emit(
      "incident.chat_updated",
      incidentId,
      message
    );
    logger.info(`Chat updated for incident: ${incidentId}`);
  };

  io.emitStatusChanged = (incidentId: string, status: string) => {
    io.emit("incident.status_changed", incidentId, status as any);
    io.to(`incident:${incidentId}`).emit(
      "incident.status_changed",
      incidentId,
      status as any
    );
    logger.info(`Status changed for incident ${incidentId}: ${status}`);
  };

  io.emitIncidentAssigned = (incidentId: string, assignee: string) => {
    io.emit("incident.assigned", incidentId, assignee);
    io.to(`incident:${incidentId}`).emit(
      "incident.assigned",
      incidentId,
      assignee
    );
    io.to(`user:${assignee}`).emit("notification", {
      type: "assignment",
      message: `You have been assigned to incident ${incidentId}`,
    });
    logger.info(`Incident ${incidentId} assigned to ${assignee}`);
  };

  io.emitRemediationStatusChanged = (
    incidentId: string,
    remediationId: string,
    status: string
  ) => {
    io.to(`incident:${incidentId}`).emit(
      "remediation.status_changed",
      incidentId,
      remediationId,
      status
    );

    // Notify admins for approval-required remediations
    if (status === "pending" || status === "approved") {
      io.to("role:admin").emit("notification", {
        type: "remediation_approval",
        message: `Remediation ${remediationId} requires approval`,
        data: { incidentId, remediationId, status },
      });
    }

    logger.info(
      `Remediation status changed: ${incidentId}/${remediationId} -> ${status}`
    );
  };

  io.notifyUser = (
    userId: string,
    notification: { type: string; message: string; data?: any }
  ) => {
    io.to(`user:${userId}`).emit("notification", notification);
  };

  io.notifyRole = (
    role: string,
    notification: { type: string; message: string; data?: any }
  ) => {
    io.to(`role:${role}`).emit("notification", notification);
  };

  io.broadcastNotification = (notification: {
    type: string;
    message: string;
    data?: any;
  }) => {
    io.emit("notification", notification);
  };

  return io;
};

// Extend the Server type to include our custom methods
declare module "socket.io" {
  interface Server {
    emitIncidentCreated: (incident: any) => void;
    emitIncidentUpdated: (incident: any) => void;
    emitChatUpdated: (incidentId: string, message: any) => void;
    emitStatusChanged: (incidentId: string, status: string) => void;
    emitIncidentAssigned: (incidentId: string, assignee: string) => void;
    emitRemediationStatusChanged: (
      incidentId: string,
      remediationId: string,
      status: string
    ) => void;
    notifyUser: (
      userId: string,
      notification: { type: string; message: string; data?: any }
    ) => void;
    notifyRole: (
      role: string,
      notification: { type: string; message: string; data?: any }
    ) => void;
    broadcastNotification: (notification: {
      type: string;
      message: string;
      data?: any;
    }) => void;
  }
}
