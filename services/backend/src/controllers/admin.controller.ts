import { Request, Response } from "express";
import Admin from "../models/admin.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !admin.isActive) {
      return res
        .status(401)
        .json({ error: "Invalid credentials or inactive admin." });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const jwtSecret = process.env.JWT_SECRET || "changeme";
    const token = jwt.sign({ id: admin._id, role: admin.role }, jwtSecret, {
      expiresIn: "1d",
    });
    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  const { name, email, password, permissions } = req.body;
  try {
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Admin already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      permissions,
    });
    await admin.save();
    res
      .status(201)
      .json({
        message: "Admin created.",
        admin: { id: admin._id, name: admin.name, email: admin.email },
      });
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
};
