import { genAI } from "../../config/gemini";
import { logger } from "../../config/logger";

const MAX_RETRIES = 2;

/**
 * Extract JSON from a response that might have markdown code blocks
 */
function extractJson(text: string): string {
  // Try to extract JSON from markdown code blocks
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }
  
  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  return text.trim();
}

/**
 * Wrapper around Gemini chat completions with retry logic.
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
      // Get a fresh model instance for each call
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          maxOutputTokens: params.maxTokens,
          temperature: params.temperature,
        },
      });

      // Combine system prompt and user prompt for Gemini
      const prompt = `${params.systemPrompt}\n\n${params.userPrompt}`;
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      
      if (!content) {
        throw new Error("Gemini returned empty response");
      }

      // If JSON mode is requested, extract and validate JSON
      if (params.jsonMode) {
        const jsonContent = extractJson(content);
        // Validate it's parseable JSON
        JSON.parse(jsonContent);
        return jsonContent;
      }

      return content;
    } catch (error: any) {
      lastError = error;
      logger.warn(
        `Gemini API call failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${error.message}`
      );

      if (attempt < MAX_RETRIES) {
        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
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
