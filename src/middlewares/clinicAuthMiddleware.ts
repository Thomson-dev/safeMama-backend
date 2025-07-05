import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/userModel";

export interface ClinicAuthenticatedRequest extends Request {
  user?: string;
  userRole?: string;
  token?: string;
}

const clinicAuth = async (req: ClinicAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // First, authenticate the user
    const token = req.header("x-auth-token");
    if (!token) {
      res.status(401).json({ msg: "No auth token, access denied" });
      return;
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET || "passwordKey") as JwtPayload & { id?: string };

    if (!verified || !verified.id) {
      res.status(401).json({ msg: "Token verification failed, authorization denied." });
      return;
    }

    // Check if user is a health worker
    const user = await User.findById(verified.id);
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    if (user.role !== 'health_worker') {
      res.status(403).json({ msg: "Access denied. Health worker role required." });
      return;
    }

    // Add user info to request
    req.user = verified.id;
    req.userRole = user.role;
    req.token = token;
    
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default clinicAuth;