import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import Admin from "../models/admin.model";
import { logger } from "../utils/logger";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Access denied. No token provided.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error("JWT_SECRET environment variable is not set");
      return res.status(500).json({
        error: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    // Get principal from database - check both User and Admin collections
    let principal: any = await User.findById(decoded.id).select("-password");
    if (!principal) {
      const admin = await Admin.findById(decoded.id).select("-password");
      if (!admin || !admin.isActive) {
        return res.status(401).json({
          error: "Token is not valid. User/Admin not found or inactive.",
        });
      }
      principal = admin;
    }

    req.user = principal;
    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    res.status(401).json({
      error: "Token is not valid.",
    });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as any;
        let principal: any = await User.findById(decoded.id).select(
          "-password"
        );
        if (!principal) {
          const admin = await Admin.findById(decoded.id).select("-password");
          if (admin && admin.isActive) {
            principal = admin;
          }
        }
        if (principal) {
          req.user = principal;
        }
      }
    }
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
