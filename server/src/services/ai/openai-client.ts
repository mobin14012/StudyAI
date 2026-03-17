import { openai } from "../../config/openai";
import { logger } from "../../config/logger";

const MAX_RETRIES = 1;

/**
 * Wrapper around OpenAI chat completions with retry logic.
 */
export async function chatCompletion(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  jsonMode?: boolean;
}): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        ...(params.jsonMode
          ? { response_format: { type: "json_object" as const } }
          : {}),
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI returned empty response");
      }

      return content;
    } catch (error: any) {
      lastError = error;
      logger.warn(
        `OpenAI API call failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${error.message}`
      );

      if (attempt < MAX_RETRIES) {
        // Wait 1 second before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError;
}

/**
 * Estimate token count from text.
 * Rough estimate: ~4 characters per token for English text.
 * Sufficient for chunking decisions.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within a token budget.
 * For very long texts, keeps the beginning (most important context)
 * and end (conclusions/summaries).
 */
export function truncateForTokenBudget(
  text: string,
  maxTokens: number
): string {
  const estimatedTokens = estimateTokens(text);

  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Use head + tail strategy
  const headTokens = Math.floor(maxTokens * 0.8);
  const tailTokens = Math.floor(maxTokens * 0.2);
  const headChars = headTokens * 4;
  const tailChars = tailTokens * 4;

  const head = text.slice(0, headChars);
  const tail = text.slice(-tailChars);

  return `${head}\n\n[... content truncated for processing ...]\n\n${tail}`;
}
