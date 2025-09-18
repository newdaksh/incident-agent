import { Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { authMiddleware, AuthRequest } from "./auth.middleware";

// Re-export authMiddleware as requireAuth for convenience
export const requireAuth = authMiddleware;

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `User ${
          req.user._id
        } attempted to access resource without proper role. Required: ${allowedRoles.join(
          ", "
        )}, Has: ${req.user.role}`
      );
      return res.status(403).json({
        error: "Insufficient permissions",
      });
    }

    next();
  };
};

export const requireResponder = requireRole("responder", "admin");
export const requireAdmin = requireRole("admin");

export const canManageIncidents = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const allowedRoles = ["responder", "admin"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: "Only responders and admins can manage incidents",
    });
  }

  next();
};

export const canManageRunbooks = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const allowedRoles = ["admin", "manager", "responder"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: "Only admins, managers, and responders can manage runbooks",
    });
  }

  next();
};

export const canRunRemediations = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const allowedRoles = ["responder", "admin"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: "Only responders and admins can run remediations",
    });
  }

  next();
};

export const canApproveRemediations = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  // Only admins can approve remediations for safety
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Only admins can approve remediations",
    });
  }

  next();
};
