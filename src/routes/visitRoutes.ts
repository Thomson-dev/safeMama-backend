import express from "express";
import {
  logVisit,
  getPatientAncVisits,
  getPatientVisits,
  getMyVisits,
  updateVisit,
  getNextAppointment
} from "../controllers/vistController";
import auth from "../middlewares/authMiddleware";
import clinicAuth from "../middlewares/clinicAuthMiddleware";

const router = express.Router();

// Health worker routes (require clinic authentication)
router.post("/log", clinicAuth, logVisit);                           // Health worker logs visit
router.get("/patient/:patientId/anc", clinicAuth, getPatientAncVisits);  // Get patient's ANC visits
router.get("/patient/:patientId/all", clinicAuth, getPatientVisits);     // Get all patient visits
router.put("/:id", clinicAuth, updateVisit);                        // Update visit

// Patient routes (regular authentication)
router.get("/my-visits", auth, getMyVisits);  
router.get("/next-appointment", auth, getNextAppointment);   // Patient views next appointment

export default router;