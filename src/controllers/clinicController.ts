import { Request, Response } from 'express';
import Clinic from '../models/clinicModal';

export const createClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, address, lga, state, phone, email, contactPerson } = req.body;

    const clinic = new Clinic({
      name,
      address,
      lga,
      state,
      phone,
      email,
      contactPerson
    });

    await clinic.save();

    res.status(201).json({
      success: true,
      msg: "Clinic created successfully",
      clinic
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllClinics = async (req: Request, res: Response): Promise<void> => {
  try {
    const clinics = await Clinic.find({ isActive: true });
    res.json({
      success: true,
      clinics
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};