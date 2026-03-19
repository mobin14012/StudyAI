import { z } from "zod";
import { chatCompletion, truncateForTokenBudget } from "./openai-client";
import { AppError } from "../../middleware/error-handler";
import { logger } from "../../config/logger";

const TOPIC_DETECTION_SYSTEM_PROMPT = `You are an expert academic content analyzer. Your task is to identify the main educational topics from study material text.

Rules:
1. Return a JSON object with a single key "topics" containing an array of topic strings.
2. Each topic should be a concise phrase (2-5 words) representing a distinct educational concept.
3. Extract between 3 and 15 topics depending on the material's breadth.
4. Topics should be specific enough to generate study questions from.
5. Order topics from most prominent to least prominent in the text.
6. Do not include meta-topics like "Introduction" or "Conclusion".
7. Do not include generic topics like "Study Guide" or "Chapter Summary".`;

const topicResponseSchema = z.object({
  topics: z.array(z.string().min(1).max(100)).min(1).max(20),
});

/**
 * Detect educational topics from study material text using OpenAI.
 * Returns an array of topic name strings.
 */
export async function detectTopics(text: string): Promise<string[]> {
  // Truncate if needed — topic detection works well with head+tail strategy
  const truncated = truncateForTokenBudget(text, 60000);

  const userPrompt = `Analyze the following study material and extract the main educational topics.

MATERIAL:
---
${truncated}
---

Return ONLY a JSON object in this exact format:
{"topics": ["Topic 1", "Topic 2", ...]}`;

  try {
    const raw = await chatCompletion({
      systemPrompt: TOPIC_DETECTION_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 500,
      temperature: 0.3,
      jsonMode: true,
    });

    const parsed = JSON.parse(raw);
    const validated = topicResponseSchema.parse(parsed);
    return validated.topics;
  } catch (error: any) {
    logger.error("Topic detection failed:", error);

    // If it's already an AppError (from OpenAI client), re-throw
    if (error instanceof AppError) {
      throw error;
    }

    // Check for common OpenAI errors
    if (error.code === "insufficient_quota" || error.message?.includes("quota")) {
      throw new AppError(
        "AI service quota exceeded. Please try again later.",
        503,
        "AI_QUOTA_EXCEEDED"
      );
    }

    if (error.code === "invalid_api_key" || error.message?.includes("API key")) {
      throw new AppError(
        "AI service configuration error. Please contact support.",
        503,
        "AI_CONFIG_ERROR"
      );
    }

    if (error.name === "SyntaxError" || error instanceof z.ZodError) {
      throw new AppError(
        "Failed to parse AI response. Please try again.",
        500,
        "AI_PARSE_ERROR"
      );
    }

    throw new AppError(
      "Unable to detect topics. Please try again.",
      500,
      "TOPIC_DETECTION_FAILED"
    );
  }
}
