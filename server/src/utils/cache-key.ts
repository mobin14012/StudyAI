import crypto from "crypto";

export type QuestionType = "mcq" | "short_answer" | "true_false";
export type DifficultyLevel = "easy" | "medium" | "hard";

/**
 * Generate a cache key for question lookups.
 * Same inputs always produce the same 32-character hash.
 */
export function generateCacheKey(
  materialId: string,
  topic: string,
  difficulty: DifficultyLevel,
  type: QuestionType
): string {
  const input = `${materialId}:${topic.toLowerCase().trim()}:${difficulty}:${type}`;
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
}
