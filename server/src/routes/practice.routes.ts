import { Router, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { aiLimiter } from "../middleware/rate-limit";
import {
  startPracticeSchema,
  submitAnswerSchema,
  sessionIdParamSchema,
} from "../schemas/practice.schemas";
import {
  startPracticeSession,
  submitAnswer,
  getSessionResults,
} from "../services/practice.service";
import { AuthRequest } from "../types/index";

const router = Router();

// All practice routes require authentication
router.use(authenticate as any);

// POST /api/practice/start — Start a new practice session
router.post(
  "/start",
  validate(startPracticeSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await startPracticeSession(req.body, req.userId!);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/practice/submit — Submit an answer
router.post(
  "/submit",
  aiLimiter,
  validate(submitAnswerSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await submitAnswer(req.body, req.userId!);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/practice/session/:sessionId — Get session results
router.get(
  "/session/:sessionId",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = sessionIdParamSchema.parse(req.params);
      const result = await getSessionResults(sessionId, req.userId!);
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
