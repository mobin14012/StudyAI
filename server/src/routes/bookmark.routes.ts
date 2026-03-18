import { Router, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { authenticate } from "../middleware/authenticate";
import { Bookmark } from "../models/Bookmark";
import { Question } from "../models/Question";
import { AuthRequest } from "../types/index";
import { AppError } from "../middleware/error-handler";

const router = Router();

router.use(authenticate as unknown as Parameters<typeof router.use>[0]);

// GET /api/bookmarks — List all bookmarks with questions
router.get(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const bookmarks = await Bookmark.find({ userId: req.userId })
        .populate({
          path: "questionId",
          select: "type difficulty text options topic materialId createdAt",
        })
        .sort({ createdAt: -1 })
        .lean();

      const data = bookmarks
        .filter((b) => b.questionId) // Filter out deleted questions
        .map((b) => ({
          id: b._id.toString(),
          question: {
            id: (b.questionId as any)._id.toString(),
            type: (b.questionId as any).type,
            difficulty: (b.questionId as any).difficulty,
            text: (b.questionId as any).text,
            options: (b.questionId as any).options,
            topic: (b.questionId as any).topic,
            materialId: (b.questionId as any).materialId.toString(),
          },
          createdAt: b.createdAt,
        }));

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/bookmarks — Add bookmark
router.post(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { questionId } = req.body;

      if (!questionId || !Types.ObjectId.isValid(questionId)) {
        throw new AppError("Valid question ID required", 400, "INVALID_INPUT");
      }

      // Verify question exists and belongs to user
      const question = await Question.findOne({
        _id: questionId,
        userId: req.userId,
      });

      if (!question) {
        throw new AppError("Question not found", 404, "QUESTION_NOT_FOUND");
      }

      // Create bookmark (will fail if duplicate due to unique index)
      const bookmark = await Bookmark.create({
        userId: req.userId,
        questionId,
      });

      res.status(201).json({
        success: true,
        data: { id: bookmark._id.toString(), questionId },
      });
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error
        res.json({
          success: true,
          data: { message: "Already bookmarked" },
        });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/bookmarks/:questionId — Remove bookmark
router.delete(
  "/:questionId",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { questionId } = req.params;

      const result = await Bookmark.deleteOne({
        userId: req.userId,
        questionId,
      });

      if (result.deletedCount === 0) {
        throw new AppError("Bookmark not found", 404, "BOOKMARK_NOT_FOUND");
      }

      res.json({ success: true, data: { message: "Bookmark removed" } });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/bookmarks/check/:questionId — Check if bookmarked
router.get(
  "/check/:questionId",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { questionId } = req.params;

      const exists = await Bookmark.exists({
        userId: req.userId,
        questionId,
      });

      res.json({ success: true, data: { isBookmarked: !!exists } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
