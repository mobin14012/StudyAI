import { z } from "zod";

export const updateTopicsSchema = z.object({
  topics: z
    .array(
      z.object({
        name: z.string().min(1, "Topic name required").max(100),
        selected: z.boolean(),
      })
    )
    .min(1, "At least one topic required")
    .max(20),
});

export const materialListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const materialIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid material ID"),
});

export type UpdateTopicsInput = z.infer<typeof updateTopicsSchema>;
export type MaterialListQuery = z.infer<typeof materialListQuerySchema>;
export type MaterialIdParam = z.infer<typeof materialIdParamSchema>;
