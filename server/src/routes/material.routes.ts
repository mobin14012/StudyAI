import { Router, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authenticate";
import { uploadSingle, handleMulterError } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { aiLimiter } from "../middleware/ai-rate-limit";
import {
  updateTopicsSchema,
  materialListQuerySchema,
  materialIdParamSchema,
} from "../schemas/material.schemas";
import {
  processUpload,
  getMaterials,
  getMaterialById,
  updateTopicSelections,
  getOrGenerateSummary,
  deleteMaterial,
  retryTopicDetection,
} from "../services/material.service";
import { AuthRequest } from "../types/index";

const router = Router();

// All material routes require authentication
router.use(authenticate as any);

// POST /api/materials/upload — Upload PDF or text file
router.post(
  "/upload",
  uploadSingle,
  handleMulterError,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: "NO_FILE", message: "No file uploaded" },
        });
        return;
      }

      const result = await processUpload(req.userId!, req.file);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/materials — List user's materials (paginated)
router.get(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = materialListQuerySchema.parse(req.query);
      const result = await getMaterials(req.userId!, query.page, query.limit, query.status);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/materials/:id — Get single material
router.get(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = materialIdParamSchema.parse(req.params);
      const material = await getMaterialById(id, req.userId!);
      res.json({
        success: true,
        data: material,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/materials/:id/topics — Update topic selections
router.patch(
  "/:id/topics",
  validate(updateTopicsSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = materialIdParamSchema.parse(req.params);
      const result = await updateTopicSelections(
        id,
        req.userId!,
        req.body.topics
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/materials/:id/summary — Generate or get cached summary
router.post(
  "/:id/summary",
  aiLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = materialIdParamSchema.parse(req.params);
      const result = await getOrGenerateSummary(id, req.userId!);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/materials/:id/retry-topics — Retry topic detection
router.post(
  "/:id/retry-topics",
  aiLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = materialIdParamSchema.parse(req.params);
      const result = await retryTopicDetection(id, req.userId!);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/materials/:id — Delete a material
router.delete(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = materialIdParamSchema.parse(req.params);
      await deleteMaterial(id, req.userId!);
      res.json({
        success: true,
        data: { message: "Material deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
