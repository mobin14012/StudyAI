---
plan: 04-01
title: Backend Practice Engine
phase: 04-practice-engine
requirements: [PRAC-01, PRAC-03, PRAC-04, PRAC-05, PRAC-07, PRAC-08]
depends-on: Phase 3 complete
estimated-tasks: 6
---

# Plan 04-01: Backend Practice Engine

## Goal
Implement the server-side practice engine: Attempt model, answer evaluation (exact match + AI), practice service, and REST API routes.

## Requirements Addressed
- **PRAC-01**: Start practice session from materials
- **PRAC-03**: Submit answer for each question
- **PRAC-04**: MCQ/T-F evaluated by exact match
- **PRAC-05**: Short answers evaluated by AI
- **PRAC-07**: General mode and weak-topic drill mode
- **PRAC-08**: Each attempt stored in database

---

## Tasks

### Task 1: Create Attempt Model
**File:** `server/src/models/Attempt.ts`

```typescript
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAttempt extends Document {
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  materialId: Types.ObjectId;
  sessionId: string;
  topic: string;
  questionType: "mcq" | "short_answer" | "true_false";
  difficulty: "easy" | "medium" | "hard";
  userAnswer: string;
  isCorrect: boolean;
  aiEvaluation?: {
    score: number;
    feedback: string;
    isCorrect: boolean;
  };
  timeSpentMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const attemptSchema = new Schema<IAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      index: true,
    },
    questionType: {
      type: String,
      enum: ["mcq", "short_answer", "true_false"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    userAnswer: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    aiEvaluation: {
      score: Number,
      feedback: String,
      isCorrect: Boolean,
    },
    timeSpentMs: Number,
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics queries
attemptSchema.index({ userId: 1, createdAt: -1 });
attemptSchema.index({ userId: 1, topic: 1, createdAt: -1 });
attemptSchema.index({ userId: 1, isCorrect: 1 });
attemptSchema.index({ sessionId: 1, createdAt: 1 });

export const Attempt = mongoose.model<IAttempt>("Attempt", attemptSchema);
```

---

### Task 2: Create Answer Evaluator AI Service
**File:** `server/src/services/ai/answer-evaluator.ts`

```typescript
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
```

---

### Task 3: Create Practice Validation Schemas
**File:** `server/src/schemas/practice.schemas.ts`

```typescript
import { z } from "zod";

export const startPracticeSchema = z.object({
  mode: z.enum(["general", "weak_topic"]),
  materialId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid material ID")
    .optional(),
  questionCount: z.number().int().min(1).max(20).default(10),
}).refine(
  (data) => {
    // materialId required for general mode
    if (data.mode === "general" && !data.materialId) {
      return false;
    }
    return true;
  },
  {
    message: "materialId is required for general mode",
    path: ["materialId"],
  }
);

export const submitAnswerSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid question ID"),
  answer: z.string().min(1, "Answer required").max(2000),
  timeSpentMs: z.number().int().min(0).optional(),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
});

export type StartPracticeInput = z.infer<typeof startPracticeSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
```

---

### Task 4: Create Practice Service
**File:** `server/src/services/practice.service.ts`

```typescript
import { v4 as uuidv4 } from "uuid";
import { Types } from "mongoose";
import { Question, IQuestion } from "../models/Question";
import { Attempt, IAttempt } from "../models/Attempt";
import { AppError } from "../middleware/error-handler";
import { evaluateShortAnswer, evaluateExactMatch } from "./ai/answer-evaluator";
import { logger } from "../config/logger";
import type { StartPracticeInput, SubmitAnswerInput } from "../schemas/practice.schemas";

interface PracticeQuestion {
  id: string;
  type: "mcq" | "short_answer" | "true_false";
  difficulty: "easy" | "medium" | "hard";
  text: string;
  options?: string[];
  topic: string;
}

interface StartSessionResult {
  sessionId: string;
  mode: "general" | "weak_topic";
  questions: PracticeQuestion[];
  totalQuestions: number;
}

interface SubmitResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
    isCorrect: boolean;
  };
  attemptId: string;
}

interface SessionAttempt {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
  };
}

interface SessionResult {
  sessionId: string;
  attempts: SessionAttempt[];
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
}

/**
 * Get weak topics for a user (topics with < 70% accuracy).
 */
async function getWeakTopics(userId: string): Promise<string[]> {
  const pipeline = [
    { $match: { userId: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$topic",
        total: { $sum: 1 },
        correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
      },
    },
    {
      $project: {
        topic: "$_id",
        accuracy: { $divide: ["$correct", "$total"] },
      },
    },
    { $match: { accuracy: { $lt: 0.7 } } },
    { $sort: { accuracy: 1 as const } },
    { $limit: 5 },
  ];

  const results = await Attempt.aggregate(pipeline);
  return results.map((r) => r.topic);
}

/**
 * Strip answer fields from question for practice.
 */
function stripQuestionForPractice(question: IQuestion): PracticeQuestion {
  return {
    id: question._id.toString(),
    type: question.type,
    difficulty: question.difficulty,
    text: question.text,
    options: question.options,
    topic: question.topic,
  };
}

/**
 * Start a new practice session.
 */
export async function startPracticeSession(
  params: StartPracticeInput,
  userId: string
): Promise<StartSessionResult> {
  const { mode, materialId, questionCount } = params;
  let questions: IQuestion[];

  if (mode === "general") {
    // Fetch random questions from the specified material
    questions = await Question.aggregate([
      {
        $match: {
          materialId: new Types.ObjectId(materialId),
          userId: new Types.ObjectId(userId),
        },
      },
      { $sample: { size: questionCount } },
    ]);

    if (questions.length === 0) {
      throw new AppError(
        "No questions found for this material. Generate questions first.",
        400,
        "NO_QUESTIONS_FOUND"
      );
    }
  } else {
    // Weak topic mode: get questions from weak topics
    const weakTopics = await getWeakTopics(userId);

    if (weakTopics.length === 0) {
      throw new AppError(
        "No weak topics identified yet. Complete some practice sessions first.",
        400,
        "NO_WEAK_TOPICS"
      );
    }

    questions = await Question.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          topic: { $in: weakTopics },
        },
      },
      { $sample: { size: questionCount } },
    ]);

    if (questions.length === 0) {
      throw new AppError(
        "No questions found for weak topics.",
        400,
        "NO_QUESTIONS_FOUND"
      );
    }
  }

  const sessionId = uuidv4();

  logger.info(
    `Started practice session ${sessionId} for user ${userId}, mode: ${mode}, questions: ${questions.length}`
  );

  return {
    sessionId,
    mode,
    questions: questions.map(stripQuestionForPractice),
    totalQuestions: questions.length,
  };
}

/**
 * Submit an answer for a question.
 */
export async function submitAnswer(
  params: SubmitAnswerInput,
  userId: string
): Promise<SubmitResult> {
  const { sessionId, questionId, answer, timeSpentMs } = params;

  // Get the question with answer
  const question = await Question.findOne({
    _id: questionId,
    userId,
  });

  if (!question) {
    throw new AppError("Question not found", 404, "QUESTION_NOT_FOUND");
  }

  let isCorrect: boolean;
  let aiEvaluation: SubmitResult["aiEvaluation"] | undefined;

  if (question.type === "short_answer") {
    // AI semantic evaluation
    const evaluation = await evaluateShortAnswer({
      question: question.text,
      correctAnswer: question.correctAnswer,
      userAnswer: answer,
      explanation: question.explanation,
    });

    isCorrect = evaluation.isCorrect;
    aiEvaluation = evaluation;
  } else {
    // Exact match for MCQ and True/False
    isCorrect = evaluateExactMatch(answer, question.correctAnswer, question.type);
  }

  // Store attempt in database
  const attempt = await Attempt.create({
    userId: new Types.ObjectId(userId),
    questionId: question._id,
    materialId: question.materialId,
    sessionId,
    topic: question.topic,
    questionType: question.type,
    difficulty: question.difficulty,
    userAnswer: answer,
    isCorrect,
    aiEvaluation,
    timeSpentMs,
  });

  logger.info(
    `Answer submitted for session ${sessionId}, question ${questionId}, correct: ${isCorrect}`
  );

  return {
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    aiEvaluation,
    attemptId: attempt._id.toString(),
  };
}

/**
 * Get results for a practice session.
 */
export async function getSessionResults(
  sessionId: string,
  userId: string
): Promise<SessionResult> {
  const attempts = await Attempt.find({
    sessionId,
    userId,
  })
    .populate<{ questionId: IQuestion }>("questionId", "correctAnswer explanation")
    .sort({ createdAt: 1 })
    .lean();

  if (attempts.length === 0) {
    throw new AppError("Session not found", 404, "SESSION_NOT_FOUND");
  }

  const correct = attempts.filter((a) => a.isCorrect).length;
  const total = attempts.length;

  return {
    sessionId,
    attempts: attempts.map((a) => ({
      questionId: a.questionId._id?.toString() || a.questionId.toString(),
      userAnswer: a.userAnswer,
      isCorrect: a.isCorrect,
      correctAnswer: (a.questionId as IQuestion).correctAnswer || "",
      explanation: (a.questionId as IQuestion).explanation || "",
      aiEvaluation: a.aiEvaluation
        ? { score: a.aiEvaluation.score, feedback: a.aiEvaluation.feedback }
        : undefined,
    })),
    score: {
      correct,
      total,
      percentage: Math.round((correct / total) * 100),
    },
  };
}
```

---

### Task 5: Create Practice Routes
**File:** `server/src/routes/practice.routes.ts`

```typescript
import { Router, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { aiLimiter } from "../middleware/rate-limit";
import {
  startPracticeSchema,
  submitAnswerSchema,
  sessionIdParamSchema,
} from "../schemas/practice.schemas";
import {
  startPracticeSession,
  submitAnswer,
  getSessionResults,
} from "../services/practice.service";
import { AuthRequest } from "../types/index";

const router = Router();

// All practice routes require authentication
router.use(authenticate as any);

// POST /api/practice/start — Start a new practice session
router.post(
  "/start",
  validate(startPracticeSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await startPracticeSession(req.body, req.userId!);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/practice/submit — Submit an answer
router.post(
  "/submit",
  aiLimiter,
  validate(submitAnswerSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await submitAnswer(req.body, req.userId!);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/practice/session/:sessionId — Get session results
router.get(
  "/session/:sessionId",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = sessionIdParamSchema.parse(req.params);
      const result = await getSessionResults(sessionId, req.userId!);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

---

### Task 6: Register Practice Routes in App
**File:** `server/src/app.ts`
**Change:** Add practice routes import and registration

```typescript
// Add import
import practiceRoutes from "./routes/practice.routes";

// Add route (after questions)
app.use("/api/practice", practiceRoutes);
```

---

## Verification

After completing all tasks:

1. **Build check:**
   ```bash
   cd server && npm run build
   ```

2. **Type check:**
   ```bash
   cd server && npx tsc --noEmit
   ```

Expected: 0 errors

---

## Files Created/Modified

| File | Action |
|------|--------|
| `server/src/models/Attempt.ts` | CREATE |
| `server/src/services/ai/answer-evaluator.ts` | CREATE |
| `server/src/schemas/practice.schemas.ts` | CREATE |
| `server/src/services/practice.service.ts` | CREATE |
| `server/src/routes/practice.routes.ts` | CREATE |
| `server/src/app.ts` | MODIFY |

---

## Dependencies

- `uuid` package for session IDs (need to verify if installed)

Check with: `npm ls uuid` in server directory

If not installed: `npm install uuid @types/uuid`
