import { chatCompletion, truncateForTokenBudget } from "./gemini-client";
import {
  validateGeneratedQuestions,
  parseAiResponse,
  GeneratedQuestion,
} from "./question-validator";
import { logger } from "../../config/logger";
import type { QuestionType, DifficultyLevel } from "../../utils/cache-key";

export type { GeneratedQuestion };

const QUESTION_GENERATOR_SYSTEM_PROMPT = `You are an expert educational content creator. Generate study questions from the provided source material.

CRITICAL RULES:
1. ONLY generate questions that can be answered using information explicitly stated in the source material.
2. DO NOT use outside knowledge. If information isn't in the source, don't ask about it.
3. For each question, include the exact excerpt from the source that contains the answer.
4. Generate questions that test understanding, not just memorization.
5. Ensure questions are clear, unambiguous, and grammatically correct.
6. For MCQ: provide exactly 4 options with only one correct answer. The correctAnswer MUST be the exact text of one of the options. Incorrect options should be plausible but clearly wrong based on the source.
7. For true/false: create a statement that is definitively true or false based on the source. The correctAnswer must be exactly "True" or "False".
8. For short answer: the answer should be 1-3 sentences maximum.

OUTPUT FORMAT:
Return a JSON object with a "questions" array. Each question object must have:
- type: "mcq" | "short_answer" | "true_false"
- difficulty: "easy" | "medium" | "hard" (must match the requested difficulty)
- text: the question text
- options: array of 4 strings (ONLY for MCQ, omit for other types)
- correctAnswer: the correct answer text (for MCQ, must be exact text of one option)
- explanation: why this is the correct answer (1-2 sentences)
- topic: the topic this question belongs to (must match the requested topic)
- sourceExcerpt: the exact quote from the source material (max 200 chars)`;

const DIFFICULTY_GUIDELINES: Record<DifficultyLevel, string> = {
  easy: `
EASY difficulty means:
- Questions about explicitly stated facts
- Direct recall from the text
- Simple definitions and basic concepts
- "What is..." or "Name the..." style questions`,

  medium: `
MEDIUM difficulty means:
- Questions requiring connection between multiple facts
- Application of concepts to examples
- "Why does..." or "How does..." style questions
- Comparisons and relationships`,

  hard: `
HARD difficulty means:
- Questions requiring analysis and synthesis
- Inference from multiple parts of the text
- "What would happen if..." or "Evaluate..." style questions
- Critical thinking and deeper understanding`,
};

interface GenerationParams {
  sourceText: string;
  topic: string;
  difficulty: DifficultyLevel;
  types: QuestionType[];
  count: number;
}

/**
 * Build the user prompt for question generation.
 */
function buildUserPrompt(params: GenerationParams): string {
  const { sourceText, topic, difficulty, types, count } = params;

  let typeInstruction: string;
  if (types.length === 1) {
    typeInstruction = `Generate exactly ${count} ${types[0].replace("_", " ")} questions.`;
  } else {
    const perType = Math.ceil(count / types.length);
    const distribution = types
      .map((t) => `${perType} ${t.replace("_", " ")}`)
      .join(", ");
    typeInstruction = `Generate a total of ${count} questions distributed as: ${distribution}.`;
  }

  return `Generate study questions about "${topic}" from the following source material.

REQUIREMENTS:
- Difficulty level: ${difficulty}
- ${typeInstruction}
- All questions must be answerable from the source text below
- Include source excerpts to prove grounding
- The topic field in each question MUST be exactly: "${topic}"

SOURCE MATERIAL:
---
${sourceText}
---

Generate exactly ${count} questions as a JSON object:
{"questions": [...]}`;
}

/**
 * Generate questions using AI with retry logic.
 */
export async function generateQuestions(
  params: GenerationParams
): Promise<GeneratedQuestion[]> {
  const { sourceText, topic, difficulty, types, count } = params;

  // Truncate source text to fit token budget (reserve 4000 for output)
  const truncatedText = truncateForTokenBudget(sourceText, 25000);

  const systemPrompt =
    QUESTION_GENERATOR_SYSTEM_PROMPT + DIFFICULTY_GUIDELINES[difficulty];
  const userPrompt = buildUserPrompt({
    ...params,
    sourceText: truncatedText,
  });

  const maxRetries = 1;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await chatCompletion({
        systemPrompt,
        userPrompt,
        maxTokens: 4000,
        temperature: 0.7,
        jsonMode: true,
      });

      // Parse the AI response
      const rawQuestions = parseAiResponse(response);

      // Validate the questions
      const validation = validateGeneratedQuestions(
        rawQuestions,
        truncatedText,
        topic
      );

      if (validation.valid) {
        if (validation.filtered > 0) {
          logger.info(
            `Generated ${validation.questions.length} valid questions, filtered ${validation.filtered}`
          );
        }
        return validation.questions;
      }

      lastError = new Error("All generated questions failed validation");
      logger.warn(`Attempt ${attempt + 1} failed validation, retrying...`, {
        errors: validation.errors,
      });
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Question generation attempt ${attempt + 1} failed:`, error);
    }
  }

  throw lastError || new Error("Question generation failed");
}

/**
 * Calculate type distribution for batch generation.
 */
export function calculateTypeDistribution(
  types: QuestionType[],
  totalCount: number
): Map<QuestionType, number> {
  const distribution = new Map<QuestionType, number>();
  const perType = Math.floor(totalCount / types.length);
  const remainder = totalCount % types.length;

  types.forEach((type, index) => {
    // Add 1 extra to first types to handle remainder
    distribution.set(type, perType + (index < remainder ? 1 : 0));
  });

  return distribution;
}
