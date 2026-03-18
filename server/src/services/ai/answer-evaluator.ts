import { z } from "zod";
import { chatCompletion } from "./openai-client";
import { logger } from "../../config/logger";

const SYSTEM_PROMPT = `You are an educational assessment AI. Evaluate student answers against the correct answer.

Your task:
1. Compare the student's answer to the correct answer semantically (not just string matching)
2. Determine if the student's answer is essentially correct, even if worded differently
3. Provide a score from 0-100:
   - 80-100: Correct (captures the key concept)
   - 50-79: Partially correct (some understanding, missing key points)
   - 0-49: Incorrect
4. Provide brief feedback explaining why

OUTPUT FORMAT (JSON only):
{
  "score": <number 0-100>,
  "isCorrect": <boolean - true if score >= 80>,
  "feedback": "<brief explanation>"
}`;

const evaluationResponseSchema = z.object({
  score: z.number().min(0).max(100),
  isCorrect: z.boolean(),
  feedback: z.string().min(1).max(500),
});

export interface EvaluationResult {
  score: number;
  isCorrect: boolean;
  feedback: string;
}

export interface EvaluateShortAnswerParams {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
}

/**
 * Evaluate a short answer using AI semantic comparison.
 */
export async function evaluateShortAnswer(
  params: EvaluateShortAnswerParams
): Promise<EvaluationResult> {
  const userPrompt = `Question: ${params.question}

Correct Answer: ${params.correctAnswer}

Explanation: ${params.explanation}

Student's Answer: ${params.userAnswer}

Evaluate the student's answer. Is it essentially correct?`;

  try {
    const response = await chatCompletion({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 200,
      temperature: 0.3,
      jsonMode: true,
    });

    const parsed = JSON.parse(response);
    const validated = evaluationResponseSchema.parse(parsed);

    return validated;
  } catch (error) {
    logger.error("Short answer evaluation failed:", error);

    // Fallback: strict string comparison
    const normalizedUser = params.userAnswer.toLowerCase().trim();
    const normalizedCorrect = params.correctAnswer.toLowerCase().trim();
    const isCorrect = normalizedUser === normalizedCorrect;

    return {
      score: isCorrect ? 100 : 0,
      isCorrect,
      feedback: isCorrect
        ? "Exact match with correct answer."
        : "Could not perform semantic evaluation. Answer did not match exactly.",
    };
  }
}

/**
 * Evaluate MCQ or True/False answer using exact match.
 */
export function evaluateExactMatch(
  userAnswer: string,
  correctAnswer: string,
  questionType: "mcq" | "true_false"
): boolean {
  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  if (questionType === "true_false") {
    // Normalize True/False variations
    const trueValues = ["true", "t", "yes", "1"];
    const falseValues = ["false", "f", "no", "0"];

    const userBool = trueValues.includes(normalizedUser);
    const userIsFalse = falseValues.includes(normalizedUser);
    const correctBool = trueValues.includes(normalizedCorrect);

    if (!userBool && !userIsFalse) {
      return false; // Invalid answer
    }

    return userBool === correctBool;
  }

  // MCQ: exact text match
  return normalizedUser === normalizedCorrect;
}
