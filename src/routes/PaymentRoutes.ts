import express from "express";
import {
  getAllPayments,
  getMyPaymentStatus,
  updatePaymentStatus,
  processPayment,
  getEligiblePayments,
  bulkProcessPayments,
  getPaymentStatistics,
  getPaymentByUserId,
  getPaymentsByStatus,
  getPaymentsByReason
} from "../controllers/paymentController";
import auth from "../middlewares/authMiddleware";
import adminAuth from "../middlewares/adminMiddleware";

const router = express.Router();

// Patient routes
router.get("/my-status", auth, getMyPaymentStatus);

// Admin routes
router.get("/", adminAuth, getAllPayments);
router.get("/user/:userId", adminAuth, getPaymentByUserId);
router.get("/status/:status", adminAuth, getPaymentsByStatus);
router.get("/reason/:reason", adminAuth, getPaymentsByReason);
router.get("/eligible", adminAuth, getEligiblePayments);
router.get("/statistics", adminAuth, getPaymentStatistics);
router.patch("/:userId/status", adminAuth, updatePaymentStatus);
router.put("/process/:paymentId", adminAuth, processPayment);
router.put("/bulk-process", adminAuth, bulkProcessPayments);

export default router;