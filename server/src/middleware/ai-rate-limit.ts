import rateLimit from "express-rate-limit";
import { AuthRequest } from "../types/index";

// Rate limiter for AI endpoints: 30 requests per minute per user
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (req) => {
    const authReq = req as AuthRequest;
    return authReq.userId || req.ip || "anonymous";
  },
  message: {
    success: false,
    error: {
      code: "AI_RATE_LIMIT_EXCEEDED",
      message: "Too many AI requests. Please wait a minute before trying again.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
