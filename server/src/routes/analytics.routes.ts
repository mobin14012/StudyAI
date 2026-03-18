import { Router, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  getAnalyticsDashboard,
  getWeakTopicsWithStats,
  getTopicStats,
} from "../services/analytics.service";
import { AuthRequest } from "../types/index";

const router = Router();

// All analytics routes require authentication
router.use(authenticate as unknown as Parameters<typeof router.use>[0]);

// GET /api/analytics/dashboard — Get full analytics dashboard
router.get(
  "/dashboard",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dashboard = await getAnalyticsDashboard(req.userId!);
      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/analytics/weak-topics — Get weak topics only
router.get(
  "/weak-topics",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const weakTopics = await getWeakTopicsWithStats(req.userId!);
      res.json({
        success: true,
        data: weakTopics,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/analytics/topic/:topic — Get stats for single topic
router.get(
  "/topic/:topic",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const topic = req.params.topic as string;
      const stats = await getTopicStats(req.userId!, topic);
      if (!stats) {
        res.status(404).json({
          success: false,
          error: { code: "TOPIC_NOT_FOUND", message: "No data for this topic" },
        });
        return;
      }
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
