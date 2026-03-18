import { Router, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { aiLimiter } from "../middleware/ai-rate-limit";
import { chatMessageSchema } from "../schemas/tutor.schemas";
import { chatWithTutor } from "../services/tutor.service";
import { AuthRequest } from "../types/index";

const router = Router();

// All tutor routes require authentication
router.use(authenticate as unknown as Parameters<typeof router.use>[0]);

// Apply AI rate limiter
router.use(aiLimiter);

// POST /api/tutor/chat — Chat with AI tutor
router.post(
  "/chat",
  validate(chatMessageSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await chatWithTutor(req.body, req.userId!);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
