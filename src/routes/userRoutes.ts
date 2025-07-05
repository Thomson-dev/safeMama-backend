// userRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  updateProfile,
  getUserById,
  getAllMothers,
  deleteUser,
  selectClinic
} from "../controllers/userController";

import auth from "../middlewares/authMiddleware";
import adminAuth from "../middlewares/adminMiddleware";

const router = express.Router();

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Authenticated User Routes
router.put("/update-profile", auth, updateProfile);
router.get("/profile", auth, getUserById);

// Admin-only Routes
router.get("/all-mothers", adminAuth, getAllMothers);
router.delete("/:id", adminAuth, deleteUser);
router.put("/select-clinic", auth, selectClinic);

export default router;
