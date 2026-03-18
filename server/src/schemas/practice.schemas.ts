import { z } from "zod";

export const startPracticeSchema = z
  .object({
    mode: z.enum(["general", "weak_topic"]),
    materialId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid material ID")
      .optional(),
    questionCount: z.number().int().min(1).max(20).default(10),
  })
  .refine(
    (data) => {
      // materialId required for general mode
      if (data.mode === "general" && !data.materialId) {
        return false;
      }
      return true;
    },
    {
      message: "materialId is required for general mode",
      path: ["materialId"],
    }
  );

export const submitAnswerSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid question ID"),
  answer: z.string().min(1, "Answer required").max(2000),
  timeSpentMs: z.number().int().min(0).optional(),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
});

export type StartPracticeInput = z.infer<typeof startPracticeSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
