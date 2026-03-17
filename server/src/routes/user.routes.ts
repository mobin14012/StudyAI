import { Router, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { updateProfileSchema } from "../schemas/auth.schemas";
import { User } from "../models/User";
import { AuthRequest } from "../types/index";

const router = Router();

router.get(
  "/me",
  authenticate as any,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.userId).select("-passwordHash -refreshTokens");
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
        return;
      }
      res.json({
        success: true,
        data: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          level: user.level,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/me",
  authenticate as any,
  validate(updateProfileSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const updates: Record<string, any> = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.level !== undefined) updates.level = req.body.level;

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-passwordHash -refreshTokens");

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          level: user.level,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
