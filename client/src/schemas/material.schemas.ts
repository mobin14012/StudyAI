import { z } from "zod";

export const textUploadSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .trim(),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(500000, "Content too long"),
});

export type TextUploadInput = z.infer<typeof textUploadSchema>;
