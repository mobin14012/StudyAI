import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMIT", message: "Too many requests, try again later" },
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT",
      message: "Too many login attempts, please try again in 15 minutes",
    },
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: { code: "AI_RATE_LIMIT", message: "AI request limit exceeded, try again later" },
  },
});
