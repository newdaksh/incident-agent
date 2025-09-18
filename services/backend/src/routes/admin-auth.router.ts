import { Router } from "express";
import { adminLogin, createAdmin } from "../controllers/admin.controller";

const router = Router();

// POST /api/admin/login
router.post("/login", adminLogin);

// POST /api/admin/register (for initial setup, should be protected in production)
router.post("/register", createAdmin);

export default router;
