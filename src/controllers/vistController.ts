import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import Visit from '../models/vistModel';
import PaymentStatus from '../models/PaymentStatus';
import User from '../models/userModel';

// Health worker logs visit for a patient
export const logVisit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const healthWorkerId = req.user; // Health worker from auth middleware
    const { patientId, type, date, notes } = req.body;

    // Validate required fields
    if (!patientId || !type) {
      res.status(400).json({ msg: "Patient ID and visit type are required" });
      return;
    }

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      res.status(404).json({ msg: "Patient not found" });
      return;
    }

    // Create visit
    const visit = await Visit.create({
      userId: patientId,
      type,
      date: date || new Date(),
      notes,
      healthWorker: healthWorkerId
    });

    // Fetch all patient's visits
    const visits = await Visit.find({ userId: patientId });
    
    const ancVisits = visits.filter((v: any) => v.type.startsWith("ANC")).length;
    const hasDelivery = visits.some((v: any) => v.type === "DELIVERY");

    let reason = null;
    let isEligible = false;
    let incentiveAmount = 0;

    if (ancVisits >= 4) {
      reason = "ANC4";
      isEligible = true;
      incentiveAmount = 5000;
    } else if (hasDelivery) {
      reason = "DELIVERY";
      isEligible = true;
      incentiveAmount = 10000;
    }

    // Update patient's ANC visit count and eligibility
    await User.findByIdAndUpdate(patientId, {
      'reminders.ancVisits': ancVisits,
      ...(isEligible && {
        paymentStatus: "eligible",
        eligibilityReason: reason,
        cashIncentiveAmount: incentiveAmount,
        isBeneficiary: true
      })
    });

    // Create or update payment status
    if (reason) {
      const existing = await PaymentStatus.findOne({ userId: patientId });

      if (!existing) {
        await PaymentStatus.create({
          userId: patientId,
          isEligible: true,
          eligibilityReason: reason,
            reason: reason, // Add this field explicitly
          status: "pending",
          amount: incentiveAmount,
            eligibilityDate: new Date()
        });
      }
    }

    res.status(201).json({ 
      success: true,
      message: "Visit logged successfully", 
      visit,
      patientUpdate: {
        ancVisitCount: ancVisits,
        isEligible,
        eligibilityReason: reason,
        incentiveAmount
      }
    });
  } catch (err: any) {
    console.error("Log visit error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get patient's ANC visits (for health workers)
export const getPatientAncVisits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      res.status(404).json({ msg: "Patient not found" });
      return;
    }

    const ancVisits = await Visit.find({
      userId: patientId,
      type: { $regex: /^ANC/ }
    })
    .populate('healthWorker', 'fullName')
    .sort({ date: 1 });

    res.json({
      success: true,
      patient: {
        id: patient._id,
        fullName: patient.fullName,
        phone: patient.phone
      },
      count: ancVisits.length,
      visits: ancVisits
    });
  } catch (err: any) {
    console.error("Get patient ANC visits error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all visits for a patient (for health workers)
export const getPatientVisits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const patient = await User.findById(patientId);
    if (!patient) {
      res.status(404).json({ msg: "Patient not found" });
      return;
    }

    const visits = await Visit.find({ userId: patientId })
      .populate('healthWorker', 'fullName')
      .sort({ date: -1 });

    interface VisitSummary {
      totalVisits: number;
      ancVisits: number;
      deliveryVisits: number;
      postnatalVisits: number;
    }

    // If you have a Visit type/interface, use it here. Otherwise, fallback to any.
    const summary: VisitSummary = {
      totalVisits: visits.length,
      ancVisits: visits.filter((v: any) => v.type.startsWith('ANC')).length,
      deliveryVisits: visits.filter((v: any) => v.type === 'DELIVERY').length,
      postnatalVisits: visits.filter((v: any) => v.type === 'POSTNATAL').length
    };

    res.json({
      success: true,
      patient: {
        id: patient._id,
        fullName: patient.fullName,
        phone: patient.phone,
        edd: patient.edd,
        paymentStatus: patient.paymentStatus,
        ancVisitCount: patient.reminders?.ancVisits
      },
      summary,
      visits
    });
  } catch (err: any) {
    console.error("Get patient visits error:", err);
    res.status(500).json({ error: err.message });
  }
};




export const getNextAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user;

    // Get latest ANC visit
    const lastVisit = await Visit.findOne({
      userId,
      type: { $regex: /^ANC/ }
    }).sort({ date: -1 });

    if (!lastVisit) {
      res.json({
        success: true,
        message: "No ANC visit yet. Book your first visit!",
        nextAppointment: null,
        lastVisit: null
      });
      return;
    }

    // Add 28 days to the last visit date
    const nextDate = new Date(lastVisit.date);
    nextDate.setDate(nextDate.getDate() + 28);

    // Get current visit count
    const ancVisitCount = await Visit.countDocuments({
      userId,
      type: { $regex: /^ANC/ }
    });

    // Determine next visit type
    let nextVisitType = `ANC${ancVisitCount + 1}`;
    if (ancVisitCount >= 8) {
      nextVisitType = "DELIVERY";
    }

    res.json({
      success: true,
      lastVisit: {
        type: lastVisit.type,
        date: lastVisit.date,
        notes: lastVisit.notes
      },
      nextAppointment: {
        date: nextDate,
        type: nextVisitType,
        daysFromNow: Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      },
      visitCount: ancVisitCount
    });
  } catch (err: any) {
    console.error("Get next appointment error:", err);
    res.status(500).json({ error: err.message });
  }
};


// Patient can view their own visits
export const getMyVisits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user;

    const visits = await Visit.find({ userId })
      .populate('healthWorker', 'fullName')
      .sort({ date: -1 });

    interface VisitSummary {
      totalVisits: number;
      ancVisits: number;
    //   deliveryVisits: number;
    //   postnatalVisits: number;
    }

    interface VisitDoc {
      type: string;
      [key: string]: any;
    }

    const summary: VisitSummary = {
      totalVisits: visits.length,
      ancVisits: visits.filter((v: VisitDoc) => v.type.startsWith('ANC')).length,
    //   deliveryVisits: visits.filter((v: VisitDoc) => v.type === 'DELIVERY').length,
    //   postnatalVisits: visits.filter((v: VisitDoc) => v.type === 'POSTNATAL').length
    };

    res.json({
      success: true,
      summary,
      visits
    });
  } catch (err: any) {
    console.error("Get my visits error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update visit (health workers only)
export const updateVisit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, date, notes } = req.body;

    const visit = await Visit.findByIdAndUpdate(
      id,
      { type, date, notes },
      { new: true }
    ).populate('healthWorker', 'fullName');

    if (!visit) {
      res.status(404).json({ msg: "Visit not found" });
      return;
    }

    res.json({
      success: true,
      message: "Visit updated successfully",
      visit
    });
  } catch (err: any) {
    console.error("Update visit error:", err);
    res.status(500).json({ error: err.message });
  }
};