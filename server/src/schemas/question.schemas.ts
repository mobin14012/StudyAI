import { z } from "zod";

export const generateQuestionsSchema = z.object({
  materialId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid material ID"),
  topic: z.string().min(1, "Topic required").max(100),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  types: z
    .array(z.enum(["mcq", "short_answer", "true_false"]))
    .min(1, "At least one question type required")
    .max(3)
    .default(["mcq"]),
  count: z.number().int().min(1).max(10).default(5),
});

export const questionListQuerySchema = z.object({
  materialId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  topic: z.string().max(100).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  type: z.enum(["mcq", "short_answer", "true_false"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const questionIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid question ID"),
});

export const batchDeleteSchema = z.object({
  ids: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/))
    .min(1, "At least one ID required")
    .max(50, "Maximum 50 IDs per batch"),
});

export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
export type QuestionListQuery = z.infer<typeof questionListQuerySchema>;
export type QuestionIdParam = z.infer<typeof questionIdParamSchema>;
export type BatchDeleteInput = z.infer<typeof batchDeleteSchema>;
