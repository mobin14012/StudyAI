import { z } from "zod";

export const chatMessageSchema = z.object({
  materialId: z.string().min(1, "Material ID is required"),
  message: z.string().min(1, "Message is required").max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(10).default([]),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
