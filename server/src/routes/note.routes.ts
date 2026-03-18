import { Router, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { Note } from "../models/Note";
import { createNoteSchema, updateNoteSchema } from "../schemas/note.schemas";
import { AuthRequest } from "../types/index";
import { AppError } from "../middleware/error-handler";

const router = Router();

router.use(authenticate as unknown as Parameters<typeof router.use>[0]);

// GET /api/notes — List notes (with optional search)
router.get(
  "/",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query;
      
      let query: Record<string, unknown> = { userId: req.userId };
      
      if (q && typeof q === "string" && q.trim()) {
        query = { ...query, $text: { $search: q.trim() } };
      }

      const notes = await Note.find(query)
        .sort({ updatedAt: -1 })
        .select("title content createdAt updatedAt")
        .lean();

      const data = notes.map((n) => ({
        id: n._id.toString(),
        title: n.title,
        content: n.content,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/notes/:id — Get single note
router.get(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const note = await Note.findOne({
        _id: req.params.id,
        userId: req.userId,
      }).lean();

      if (!note) {
        throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
      }

      res.json({
        success: true,
        data: {
          id: note._id.toString(),
          title: note.title,
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/notes — Create note
router.post(
  "/",
  validate(createNoteSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const note = await Note.create({
        userId: req.userId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        data: {
          id: note._id.toString(),
          title: note.title,
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/notes/:id — Update note
router.patch(
  "/:id",
  validate(updateNoteSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const note = await Note.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true }
      ).lean();

      if (!note) {
        throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
      }

      res.json({
        success: true,
        data: {
          id: note._id.toString(),
          title: note.title,
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/notes/:id — Delete note
router.delete(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await Note.deleteOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (result.deletedCount === 0) {
        throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
      }

      res.json({ success: true, data: { message: "Note deleted" } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
