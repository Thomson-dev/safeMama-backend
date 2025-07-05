import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: string;
  token?: string;
}

const auth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
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

    req.user = verified.id;
    req.token = token;
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default auth;