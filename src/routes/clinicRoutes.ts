import express from "express";
import { createClinic, getAllClinics } from "../controllers/clinicController";

const router = express.Router();

router.post("/", createClinic);
router.get("/", getAllClinics);

export default router;