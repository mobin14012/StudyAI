import { z } from "zod";
import { logger } from "../../config/logger";

/**
 * Schema for a single generated question from AI response.
 */
const generatedQuestionSchema = z.object({
  type: z.enum(["mcq", "short_answer", "true_false"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  text: z.string().min(10).max(2000),
  options: z.array(z.string().min(1).max(500)).length(4).optional(),
  correctAnswer: z.string().min(1).max(1000),
  explanation: z.string().min(10).max(2000),
  topic: z.string().min(1).max(100),
  sourceExcerpt: z.string().min(5).max(500).optional(),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export interface ValidationResult {
  valid: boolean;
  questions: GeneratedQuestion[];
  filtered: number;
  errors: string[];
}

/**
 * Validate that the sourceExcerpt exists in the source material.
 * Uses fuzzy word matching with 80% threshold.
 */
export function validateSourceGrounding(
  sourceExcerpt: string | undefined,
  sourceText: string
): boolean {
  if (!sourceExcerpt) return true; // Optional field

  const normalizedExcerpt = sourceExcerpt.toLowerCase().trim();
  const normalizedSource = sourceText.toLowerCase();

  // Extract significant words (length > 3)
  const excerptWords = normalizedExcerpt
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (excerptWords.length === 0) return true;

  // Check how many words appear in the source
  const matchedWords = excerptWords.filter((word) =>
    normalizedSource.includes(word)
  );

  // Require at least 80% of significant words to match
  return matchedWords.length >= excerptWords.length * 0.8;
}

/**
 * Validate a single generated question.
 */
function validateSingleQuestion(
  question: unknown,
  sourceText: string,
  requestedTopic: string
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Schema validation
  const parseResult = generatedQuestionSchema.safeParse(question);
  if (!parseResult.success) {
    issues.push(`Schema: ${parseResult.error.errors[0]?.message || "Invalid schema"}`);
    return { valid: false, issues };
  }

  const q = parseResult.data;

  // MCQ-specific validation
  if (q.type === "mcq") {
    if (!q.options || q.options.length !== 4) {
      issues.push("MCQ must have exactly 4 options");
    } else if (!q.options.includes(q.correctAnswer)) {
      issues.push("Correct answer must be one of the options");
    }
  }

  // True/False validation
  if (q.type === "true_false") {
    const normalizedAnswer = q.correctAnswer.toLowerCase().trim();
    if (!["true", "false"].includes(normalizedAnswer)) {
      issues.push("True/False answer must be 'True' or 'False'");
    }
  }

  // Topic validation (case-insensitive)
  if (q.topic.toLowerCase().trim() !== requestedTopic.toLowerCase().trim()) {
    // Allow partial matches or close variations
    if (!q.topic.toLowerCase().includes(requestedTopic.toLowerCase()) &&
        !requestedTopic.toLowerCase().includes(q.topic.toLowerCase())) {
      issues.push(`Topic mismatch: expected '${requestedTopic}', got '${q.topic}'`);
    }
  }

  // Source grounding validation
  if (!validateSourceGrounding(q.sourceExcerpt, sourceText)) {
    issues.push("Question not grounded in source material");
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Validate an array of generated questions.
 * Returns valid questions and logs warnings for filtered ones.
 */
export function validateGeneratedQuestions(
  rawQuestions: unknown[],
  sourceText: string,
  requestedTopic: string
): ValidationResult {
  const errors: string[] = [];
  const validQuestions: GeneratedQuestion[] = [];
  let filtered = 0;

  for (const q of rawQuestions) {
    const { valid, issues } = validateSingleQuestion(q, sourceText, requestedTopic);

    if (valid) {
      const parsed = generatedQuestionSchema.parse(q);
      // Normalize True/False answer
      if (parsed.type === "true_false") {
        const normalized = parsed.correctAnswer.toLowerCase().trim();
        parsed.correctAnswer = normalized === "true" ? "True" : "False";
      }
      validQuestions.push(parsed);
    } else {
      filtered++;
      const questionPreview =
        typeof q === "object" && q !== null && "text" in q
          ? String((q as { text: string }).text).slice(0, 50)
          : "unknown";
      errors.push(`Question "${questionPreview}...": ${issues.join(", ")}`);
    }
  }

  if (filtered > 0) {
    logger.warn(`Filtered ${filtered} invalid questions`, { errors });
  }

  return {
    valid: validQuestions.length > 0,
    questions: validQuestions,
    filtered,
    errors,
  };
}

/**
 * Parse AI response JSON and extract questions array.
 */
export function parseAiResponse(response: string): unknown[] {
  const parsed = JSON.parse(response);

  if (parsed.questions && Array.isArray(parsed.questions)) {
    return parsed.questions;
  }

  // Handle case where response is directly an array
  if (Array.isArray(parsed)) {
    return parsed;
  }

  throw new Error("AI response does not contain questions array");
}
