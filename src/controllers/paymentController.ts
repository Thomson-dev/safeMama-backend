import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import PaymentStatus from '../models/PaymentStatus';
import User from '../models/userModel';

// Get all payment statuses (Admin only)
export const getAllPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const payments = await PaymentStatus.find()
      .populate('userId', 'fullName phone email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments,
      count: payments.length
    });
  } catch (err: any) {
    console.error("Get all payments error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get payment status for a user (Patient can view their own)
export const getMyPaymentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user;

    const paymentStatus = await PaymentStatus.findOne({ userId })
      .populate('userId', 'fullName phone email');

    if (!paymentStatus) {
      res.status(404).json({ 
        success: false,
        msg: "No payment status found. Complete your ANC visits to be eligible." 
      });
      return;
    }

    res.json({
      success: true,
      paymentStatus
    });
  } catch (err: any) {
    console.error("Get my payment status error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update payment status (Admin only)
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status, accountInfo } = req.body;

    // Validate status
    if (!['pending', 'processing', 'paid', 'failed', 'cancelled'].includes(status)) {
      res.status(400).json({ msg: "Invalid payment status" });
      return;
    }

    // Find and update payment status
    const payment = await PaymentStatus.findOneAndUpdate(
      { userId },
      {
        status,
        accountInfo,
        ...(status === 'paid' && { paidAt: new Date() })
      },
      { new: true }
    ).populate('userId', 'fullName phone email');

    if (!payment) {
      res.status(404).json({ msg: "Payment record not found for this user" });
      return;
    }

    // Update user's payment status if paid
    if (status === 'paid') {
      await User.findByIdAndUpdate(userId, {
        paymentStatus: 'paid'
      });
    }

    res.json({
      success: true,
      message: "Payment status updated successfully",
      payment
    });
  } catch (err: any) {
    console.error("Update payment status error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Process payment (Admin only)
export const processPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const { 
      status, 
      paymentMethod, 
      transactionReference, 
      notes 
    } = req.body;

    const adminId = req.user;

    // Validate status
    if (!['processing', 'paid', 'failed', 'cancelled'].includes(status)) {
      res.status(400).json({ msg: "Invalid status" });
      return;
    }

    const payment = await PaymentStatus.findById(paymentId);
    if (!payment) {
      res.status(404).json({ msg: "Payment not found" });
      return;
    }

    // Update payment status
    const updates: any = {
      status,
      paymentMethod,
      transactionReference,
      notes,
      processedBy: adminId
    };

    if (status === 'paid') {
      updates.paidAt = new Date();
    }

    const updatedPayment = await PaymentStatus.findByIdAndUpdate(
      paymentId,
      updates,
      { new: true }
    ).populate('userId', 'fullName phone email');

    // Update user's payment status
    if (status === 'paid') {
      await User.findByIdAndUpdate(payment.userId, {
        paymentStatus: 'paid'
      });
    }

    res.json({
      success: true,
      message: `Payment ${status} successfully`,
      payment: updatedPayment
    });
  } catch (err: any) {
    console.error("Process payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get eligible payments (Admin only)
export const getEligiblePayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const eligiblePayments = await PaymentStatus.find({ 
      status: 'pending' 
    })
    .populate('userId', 'fullName phone email clinic')
    .sort({ eligibilityDate: 1 })
    .skip(skip)
    .limit(Number(limit));

    const totalEligible = await PaymentStatus.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      eligiblePayments,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalEligible / Number(limit)),
        totalEligible
      }
    });
  } catch (err: any) {
    console.error("Get eligible payments error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Bulk process payments (Admin only)
export const bulkProcessPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { paymentIds, status, paymentMethod, notes } = req.body;
    const adminId = req.user;

    if (!paymentIds || !Array.isArray(paymentIds)) {
      res.status(400).json({ msg: "Payment IDs array is required" });
      return;
    }

    if (!['processing', 'paid', 'failed', 'cancelled'].includes(status)) {
      res.status(400).json({ msg: "Invalid status" });
      return;
    }

    const updates: any = {
      status,
      paymentMethod,
      notes,
      processedBy: adminId
    };

    if (status === 'paid') {
      updates.paidAt = new Date();
    }

    const result = await PaymentStatus.updateMany(
      { _id: { $in: paymentIds } },
      updates
    );

    // Update user payment statuses if paid
    if (status === 'paid') {
      const payments = await PaymentStatus.find({ _id: { $in: paymentIds } });
      const userIds = payments.map(p => p.userId);
      
      await User.updateMany(
        { _id: { $in: userIds } },
        { paymentStatus: 'paid' }
      );
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} payments processed successfully`,
      processedCount: result.modifiedCount
    });
  } catch (err: any) {
    console.error("Bulk process payments error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get payment statistics (Admin only)
export const getPaymentStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await PaymentStatus.aggregate([
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmountPaid: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] 
            } 
          },
          pendingCount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] 
            } 
          },
          paidCount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] 
            } 
          },
          failedCount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] 
            } 
          },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    const reasonStats = await PaymentStatus.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      statistics: stats[0] || {},
      reasonBreakdown: reasonStats
    });
  } catch (err: any) {
    console.error("Get payment statistics error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get payment by user ID (Admin only)
export const getPaymentByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const payment = await PaymentStatus.findOne({ userId })
      .populate('userId', 'fullName phone email');

    if (!payment) {
      res.status(404).json({ msg: "Payment record not found for this user" });
      return;
    }

    res.json({
      success: true,
      payment
    });
  } catch (err: any) {
    console.error("Get payment by user ID error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get payments by status (Admin only)
export const getPaymentsByStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!['pending', 'processing', 'paid', 'failed', 'cancelled'].includes(status)) {
      res.status(400).json({ msg: "Invalid status" });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const payments = await PaymentStatus.find({ status })
      .populate('userId', 'fullName phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalPayments = await PaymentStatus.countDocuments({ status });

    res.json({
      success: true,
      payments,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalPayments / Number(limit)),
        totalPayments
      }
    });
  } catch (err: any) {
    console.error("Get payments by status error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get payments by reason (Admin only)
export const getPaymentsByReason = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!['ANC4', 'DELIVERY'].includes(reason)) {
      res.status(400).json({ msg: "Invalid reason" });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const payments = await PaymentStatus.find({ reason })
      .populate('userId', 'fullName phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalPayments = await PaymentStatus.countDocuments({ reason });

    res.json({
      success: true,
      payments,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalPayments / Number(limit)),
        totalPayments
      }
    });
  } catch (err: any) {
    console.error("Get payments by reason error:", err);
    res.status(500).json({ error: err.message });
  }
};