import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";

// Simple admin middleware - you can enhance this based on your user roles system
const adminAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // For now, we'll use a simple approach - you can enhance this later
    // You might want to check user roles from the database
    const adminToken = req.header("x-admin-token");
    
    if (!adminToken) {
      res.status(403).json({ msg: "Admin access required" });
      return;
    }
    
    // Simple admin token check - replace with your actual admin authentication
    if (adminToken !== process.env.ADMIN_SECRET) {
      res.status(403).json({ msg: "Invalid admin credentials" });
      return;
    }
    
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default adminAuth;
