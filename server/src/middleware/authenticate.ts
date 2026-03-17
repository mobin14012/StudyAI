import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthRequest } from "../types/index";

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Access token required" },
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      userId: string;
      email: string;
      level: string;
    };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userLevel = decoded.level;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: "TOKEN_EXPIRED", message: "Access token invalid or expired" },
    });
  }
}
