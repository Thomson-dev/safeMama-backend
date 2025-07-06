// userController.ts

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import Clinic from '../models/clinicModal';
import PaymentStatus from '../models/PaymentStatus';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, phone, email, password, edd, address, clinic } = req.body;

    // Validate required fields
    if (!fullName || !phone || !email || !password || !edd) {
      res.status(400).json({ msg: "Please provide all required fields: fullName, phone, email, password, edd" });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ msg: "User with this email already exists" });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      fullName,
      phone,
      email,
      password: hashedPassword,
      edd: new Date(edd),
      address,
      clinic
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "passwordKey",
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      msg: "User registered successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        edd: user.edd,
        address: user.address,
        paymentStatus: user.paymentStatus,
        isBeneficiary: user.isBeneficiary
      }
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ msg: "Please provide email and password" });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ msg: "Invalid credentials" });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ msg: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "passwordKey",
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        edd: user.edd,
        address: user.address,
        paymentStatus: user.paymentStatus,
        isBeneficiary: user.isBeneficiary,
         ancVisits: user.reminders?.ancVisits,
        nextAppointment: user.reminders?.nextAppointment
      }
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};






export const selectClinic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const { clinicId } = req.body;

    // Validate clinicId
    if (!clinicId) {
      res.status(400).json({ msg: "Clinic ID is required" });
      return;
    }

    // Check if clinic exists and is active
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      res.status(404).json({ msg: "Clinic not found" });
      return;
    }

    if (!clinic.isActive) {
      res.status(400).json({ msg: "Selected clinic is not active" });
      return;
    }

    // Update user with selected clinic
    const user = await User.findByIdAndUpdate(
      userId,
      { clinic: clinicId },
      { new: true }
    ).populate('clinic', 'name address lga state phone email contactPerson');

    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    res.json({
      success: true,
      message: "Clinic selected successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        edd: user.edd,
        address: user.address,
        clinic: user.clinic,
        paymentStatus: user.paymentStatus,
        isBeneficiary: user.isBeneficiary
      }
    });
  } catch (err: any) {
    console.error("Select clinic error:", err);
    res.status(500).json({ error: err.message });
  }
};






export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user; // This comes from the auth middleware
    const { fullName, email, address, nextAppointment, notificationPreferences } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    // Update fields if provided
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (address) user.address = address;
    // if (nextAppointment) user.reminders.nextAppointment = new Date(nextAppointment);
    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
    }

    await user.save();

    res.json({
      success: true,
      msg: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        edd: user.edd,
        address: user.address,
        paymentStatus: user.paymentStatus,
        isBeneficiary: user.isBeneficiary,
        ancVisits: user.reminders?.ancVisits,
        nextAppointment: user.reminders?.nextAppointment,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (err: any) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: err.message });
  }
};









export const updateBankInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const { bank, accountNumber, accountName, preferredPaymentMethod } = req.body;

    // Validate bank info if payment method is bank transfer
    if (preferredPaymentMethod === 'bank_transfer') {
      if (!bank || !accountNumber) {
        res.status(400).json({ msg: "Bank and account number are required for bank transfer" });
        return;
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    // Update user bank info
    const updates: any = {
      preferredPaymentMethod: preferredPaymentMethod || user.preferredPaymentMethod,
      bankInfo: {
        bank: bank || user.bankInfo?.bank,
        accountNumber: accountNumber || user.bankInfo?.accountNumber,
        accountName: accountName || user.bankInfo?.accountName || user.fullName
      }
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select('-password');

    // Update payment status record if exists
    const paymentStatus = await PaymentStatus.findOne({ userId });
    if (paymentStatus) {
      await PaymentStatus.findByIdAndUpdate(paymentStatus._id, {
        paymentMethod: preferredPaymentMethod || paymentStatus.paymentMethod,
        accountInfo: {
          bank: bank || paymentStatus.accountInfo?.bank,
          accountNumber: accountNumber || paymentStatus.accountInfo?.accountNumber,
          // Use accountName if it exists, otherwise fallback to user.fullName
          accountName: accountName || (paymentStatus.accountInfo && 'accountName' in paymentStatus.accountInfo ? (paymentStatus.accountInfo as any).accountName : user.fullName)
        }
      });
    }

    res.json({
      success: true,
      message: "Bank information updated successfully",
      user: {
        id: updatedUser?._id,
        fullName: updatedUser?.fullName,
        preferredPaymentMethod: updatedUser?.preferredPaymentMethod,
        bankInfo: updatedUser?.bankInfo
      }
    });
  } catch (err: any) {
    console.error("Update bank info error:", err);
    res.status(500).json({ error: err.message });
  }
};



export const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user;

    const user = await User.findById(userId)
      .populate('clinic', 'name address phone')
      .select('-password');

    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        edd: user.edd,
        address: user.address,
        clinic: user.clinic,
        paymentStatus: user.paymentStatus,
        eligibilityReason: user.eligibilityReason,
        cashIncentiveAmount: user.cashIncentiveAmount,
        isBeneficiary: user.isBeneficiary,
        reminders: user.reminders,
        notificationPreferences: user.notificationPreferences,
        createdAt: user.createdAt
      }
    });
  } catch (err: any) {
    console.error("Get user error:", err);
    res.status(500).json({ error: err.message });
  }
};






export const getAllMothers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, paymentStatus, isBeneficiary, search } = req.query;

    // Build filter object
    const filter: any = {};
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (isBeneficiary !== undefined) filter.isBeneficiary = isBeneficiary === 'true';
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(filter)
      .populate('clinic', 'name address')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / Number(limit));

    // Get summary statistics
    const stats = {
      totalUsers,
      beneficiaries: await User.countDocuments({ isBeneficiary: true }),
      pendingPayments: await User.countDocuments({ paymentStatus: 'pending' }),
      eligiblePayments: await User.countDocuments({ paymentStatus: 'eligible' }),
      paidPayments: await User.countDocuments({ paymentStatus: 'paid' })
    };

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalUsers,
        hasNextPage: Number(page) < totalPages,
        hasPreviousPage: Number(page) > 1
      },
      stats
    });
  } catch (err: any) {
    console.error("Get all mothers error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ msg: "User ID is required" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    // Check if user has any pending payments before deletion
    if (user.paymentStatus === 'eligible' || user.paymentStatus === 'paid') {
      res.status(400).json({ 
        msg: "Cannot delete user with active payment records. Please resolve payments first." 
      });
      return;
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      msg: "User deleted successfully"
    });
  } catch (err: any) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Additional helper functions
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ msg: "Current password and new password are required" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ msg: "Current password is incorrect" });
      return;
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      msg: "Password changed successfully"
    });
  } catch (err: any) {
    console.error("Change password error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user;

    const user = await User.findById(userId).populate('clinic', 'name address');
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    // Calculate days until EDD
    const currentDate = new Date();
    const eddDate = new Date(user.edd);
    const daysUntilEDD = Math.ceil((eddDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      dashboard: {
        user: {
          fullName: user.fullName,
          phone: user.phone,
          clinic: user.clinic
        },
        pregnancy: {
          edd: user.edd,
          daysUntilEDD,
          isOverdue: daysUntilEDD < 0
        },
        visits: {
        //   ancVisits: user.reminders.ancVisits,
        //   nextAppointment: user.reminders.nextAppointment
        },
        payments: {
          status: user.paymentStatus,
          eligibilityReason: user.eligibilityReason,
          amount: user.cashIncentiveAmount,
          isBeneficiary: user.isBeneficiary
        },
        notifications: user.notificationPreferences
      }
    });
  } catch (err: any) {
    console.error("Get dashboard stats error:", err);
    res.status(500).json({ error: err.message });
  }
};
