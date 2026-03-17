import { Router, Request, Response, NextFunction } from "express";
import { registerUser, loginUser, refreshTokens, logoutUser } from "../services/auth.service";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { authLimiter } from "../middleware/rate-limit";
import { registerSchema, loginSchema } from "../schemas/auth.schemas";
import { AuthRequest } from "../types/index";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await registerUser(req.body);
      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
      res.status(201).json({
        success: true,
        data: { accessToken: result.accessToken, user: result.user },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await loginUser(req.body);
      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
      res.json({
        success: true,
        data: { accessToken: result.accessToken, user: result.user },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawRefreshToken = req.cookies?.refreshToken;
      if (!rawRefreshToken) {
        res.status(401).json({
          success: false,
          error: { code: "INVALID_REFRESH_TOKEN", message: "Session expired, please log in again" },
        });
        return;
      }
      const result = await refreshTokens(rawRefreshToken);
      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
      res.json({
        success: true,
        data: { accessToken: result.accessToken, user: result.user },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/logout",
  authenticate as any,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rawRefreshToken = req.cookies?.refreshToken;
      if (rawRefreshToken && req.userId) {
        await logoutUser(req.userId, rawRefreshToken);
      }
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/api/auth",
      });
      res.json({
        success: true,
        data: { message: "Logged out successfully" },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
