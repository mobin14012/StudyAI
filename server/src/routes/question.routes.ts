import { Router, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { aiLimiter } from "../middleware/ai-rate-limit";
import {
  generateQuestionsSchema,
  questionListQuerySchema,
  questionIdParamSchema,
  batchDeleteSchema,
} from "../schemas/question.schemas";
import {
  generateOrGetCachedQuestions,
  listQuestions,
  getQuestionById,
  getQuestionWithAnswer,
  deleteQuestion,
  deleteQuestionsBatch,
} from "../services/question.service";
import { AuthRequest } from "../types/index";

const router = Router();

// All question routes require authentication
router.use(authenticate as any);

// POST /api/questions/generate — Generate questions for a topic
router.post(
  "/generate",
  aiLimiter,
  validate(generateQuestionsSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await generateOrGetCachedQuestions(req.body, req.userId!);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/questions — List questions with filters
router.get(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = questionListQuerySchema.parse(req.query);
      const result = await listQuestions(query, req.userId!);
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

// GET /api/questions/:id — Get single question (without answer)
router.get(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = questionIdParamSchema.parse(req.params);
      const question = await getQuestionById(id, req.userId!);
      res.json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/questions/:id/full — Get question with answer (for review)
router.get(
  "/:id/full",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = questionIdParamSchema.parse(req.params);
      const question = await getQuestionWithAnswer(id, req.userId!);
      res.json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/questions/batch — Delete multiple questions
router.delete(
  "/batch",
  validate(batchDeleteSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await deleteQuestionsBatch(req.body.ids, req.userId!);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/questions/:id — Delete single question
router.delete(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = questionIdParamSchema.parse(req.params);
      await deleteQuestion(id, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
