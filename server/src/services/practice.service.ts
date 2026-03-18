import { v4 as uuidv4 } from "uuid";
import { Types } from "mongoose";
import { Question, IQuestion } from "../models/Question";
import { Attempt } from "../models/Attempt";
import { Material } from "../models/Material";
import { User } from "../models/User";
import { AppError } from "../middleware/error-handler";
import {
  evaluateShortAnswer,
  evaluateExactMatch,
} from "./ai/answer-evaluator";
import { generateOrGetCachedQuestions } from "./question.service";
import { logger } from "../config/logger";
import type {
  StartPracticeInput,
  SubmitAnswerInput,
} from "../schemas/practice.schemas";

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
 * Get materials that contain specific topics (for adaptive generation).
 */
async function getMaterialsWithTopics(
  userId: string,
  topics: string[]
): Promise<Array<{ materialId: string; topic: string }>> {
  const materials = await Material.find({
    userId: new Types.ObjectId(userId),
    status: "ready",
    "topics.name": { $in: topics },
    "topics.selected": true,
  }).lean();

  const result: Array<{ materialId: string; topic: string }> = [];

  for (const material of materials) {
    for (const t of material.topics) {
      if (topics.includes(t.name) && t.selected) {
        result.push({
          materialId: material._id.toString(),
          topic: t.name,
        });
      }
    }
  }

  return result;
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

    // ADPT-06: If insufficient questions, try to generate more
    if (questions.length < questionCount) {
      const deficit = questionCount - questions.length;
      const materialsWithWeakTopics = await getMaterialsWithTopics(
        userId,
        weakTopics
      );

      if (materialsWithWeakTopics.length > 0) {
        logger.info(
          `Generating ${deficit} more questions for weak topics (ADPT-06)`
        );

        // Generate questions from available materials
        const countPerMaterial = Math.ceil(
          deficit / Math.min(materialsWithWeakTopics.length, 3)
        );

        for (const { materialId, topic } of materialsWithWeakTopics.slice(
          0,
          3
        )) {
          try {
            await generateOrGetCachedQuestions(
              {
                materialId,
                topic,
                types: ["mcq", "short_answer", "true_false"],
                count: countPerMaterial,
              },
              userId
            );
          } catch (error) {
            logger.warn(
              `Failed to generate questions for weak topic ${topic}: ${error}`
            );
          }
        }

        // Refetch questions after generation
        questions = await Question.aggregate([
          {
            $match: {
              userId: new Types.ObjectId(userId),
              topic: { $in: weakTopics },
            },
          },
          { $sample: { size: questionCount } },
        ]);
      }
    }

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
 * Update user's daily streak after practice activity.
 */
async function updateStreak(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = user.lastActivityDate
    ? new Date(user.lastActivityDate)
    : null;

  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Same day, no change
      return;
    } else if (diffDays === 1) {
      // Consecutive day, increment streak
      user.currentStreak += 1;
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
      }
    } else {
      // Streak broken, reset to 1
      user.currentStreak = 1;
    }
  } else {
    // First activity ever
    user.currentStreak = 1;
    user.longestStreak = 1;
  }

  user.lastActivityDate = today;
  await user.save();
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

  // Update streak tracking (PROF-05, PROF-06)
  await updateStreak(userId);

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
    .populate<{ questionId: IQuestion }>(
      "questionId",
      "correctAnswer explanation"
    )
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
      correctAnswer: (a.questionId as unknown as IQuestion).correctAnswer || "",
      explanation: (a.questionId as unknown as IQuestion).explanation || "",
      aiEvaluation: a.aiEvaluation
        ? { score: a.aiEvaluation.score, feedback: a.aiEvaluation.feedback }
        : undefined,
    })),
    score: {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    },
  };
}
