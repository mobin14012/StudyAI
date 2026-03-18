import { Question, IQuestion, QuestionType, DifficultyLevel } from "../models/Question";
import { Material, IMaterial } from "../models/Material";
import { User } from "../models/User";
import { generateCacheKey } from "../utils/cache-key";
import { generateQuestions, GeneratedQuestion } from "./ai/question-generator";
import { AppError } from "../middleware/error-handler";
import { logger } from "../config/logger";
import type { GenerateQuestionsInput, QuestionListQuery } from "../schemas/question.schemas";
import { Types } from "mongoose";

interface GenerateResult {
  questions: Array<{
    id: string;
    type: QuestionType;
    difficulty: DifficultyLevel;
    text: string;
    options?: string[];
    topic: string;
    materialId: string;
    createdAt: Date;
  }>;
  generated: number;
  cached: number;
  totalReturned: number;
}

/**
 * Get default difficulty based on user level.
 */
export function getDefaultDifficulty(
  userLevel: "junior" | "senior"
): DifficultyLevel {
  return userLevel === "junior" ? "easy" : "medium";
}

/**
 * Get material and validate it's ready for question generation.
 */
async function getMaterialForGeneration(
  materialId: string,
  userId: string,
  requestedTopic: string
): Promise<IMaterial> {
  const material = await Material.findOne({ _id: materialId, userId });

  if (!material) {
    throw new AppError("Material not found", 404, "MATERIAL_NOT_FOUND");
  }

  if (material.status !== "ready") {
    throw new AppError(
      "Material is still processing",
      400,
      "MATERIAL_NOT_READY"
    );
  }

  // Check if requested topic exists in material's topics (case-insensitive)
  const topicExists = material.topics.some(
    (t) =>
      t.name.toLowerCase().trim() === requestedTopic.toLowerCase().trim() &&
      t.selected
  );

  if (!topicExists) {
    throw new AppError(
      `Topic '${requestedTopic}' not found in this material`,
      400,
      "INVALID_TOPIC"
    );
  }

  return material;
}

/**
 * Save generated questions to database.
 */
async function saveQuestions(
  questions: GeneratedQuestion[],
  userId: string,
  materialId: string,
  difficulty: DifficultyLevel
): Promise<IQuestion[]> {
  const questionDocs = questions.map((q) => ({
    userId: new Types.ObjectId(userId),
    materialId: new Types.ObjectId(materialId),
    type: q.type,
    difficulty: q.difficulty || difficulty,
    text: q.text,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    topic: q.topic,
    sourceExcerpt: q.sourceExcerpt,
    cacheKey: generateCacheKey(materialId, q.topic, q.difficulty || difficulty, q.type as QuestionType),
  }));

  const saved = await Question.insertMany(questionDocs);
  return saved as unknown as IQuestion[];
}

/**
 * Strip answer fields from question for public response.
 */
function stripAnswer(question: IQuestion) {
  return {
    id: question._id.toString(),
    type: question.type,
    difficulty: question.difficulty,
    text: question.text,
    options: question.options,
    topic: question.topic,
    materialId: question.materialId.toString(),
    createdAt: question.createdAt,
  };
}

/**
 * Generate questions or return cached ones.
 */
export async function generateOrGetCachedQuestions(
  params: GenerateQuestionsInput,
  userId: string
): Promise<GenerateResult> {
  const { materialId, topic, types, count } = params;

  // Get user to determine default difficulty
  const user = await User.findById(userId).select("level");
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const difficulty = params.difficulty || getDefaultDifficulty(user.level);

  // Validate material and topic
  const material = await getMaterialForGeneration(materialId, userId, topic);

  // Generate cache keys for requested types
  const cacheKeys = types.map((type) =>
    generateCacheKey(materialId, topic, difficulty, type)
  );

  // Check for existing cached questions
  const cachedQuestions = await Question.find({
    cacheKey: { $in: cacheKeys },
    userId,
  });

  // Determine which types need generation
  const cachedTypes = new Set(cachedQuestions.map((q) => q.type));
  const missingTypes = types.filter((t) => !cachedTypes.has(t));

  let newQuestions: IQuestion[] = [];
  const cachedCount = cachedQuestions.length;

  if (missingTypes.length > 0) {
    // Calculate how many questions to generate
    const missingCount = Math.max(1, count - cachedCount);

    try {
      // Generate missing questions
      const generated = await generateQuestions({
        sourceText: material.extractedText,
        topic,
        difficulty,
        types: missingTypes,
        count: missingCount,
      });

      // Save generated questions
      if (generated.length > 0) {
        newQuestions = await saveQuestions(generated, userId, materialId, difficulty);
        logger.info(
          `Generated ${newQuestions.length} new questions for material ${materialId}`
        );
      }
    } catch (error) {
      logger.error("Question generation failed:", error);
      
      // If we have cached questions, return them; otherwise rethrow
      if (cachedCount === 0) {
        throw new AppError(
          "Unable to generate questions. Please try again.",
          500,
          "GENERATION_FAILED"
        );
      }
    }
  }

  // Combine cached and new questions
  const allQuestions = [...cachedQuestions, ...newQuestions];
  
  // Limit to requested count
  const limitedQuestions = allQuestions.slice(0, count);

  return {
    questions: limitedQuestions.map(stripAnswer),
    generated: newQuestions.length,
    cached: Math.min(cachedCount, count),
    totalReturned: limitedQuestions.length,
  };
}

/**
 * List questions with filters and pagination.
 */
export async function listQuestions(
  params: QuestionListQuery,
  userId: string
) {
  const { materialId, topic, difficulty, type, page, limit } = params;
  const skip = (page - 1) * limit;

  // Build query
  const query: Record<string, unknown> = { userId };
  if (materialId) query.materialId = materialId;
  if (topic) query.topic = { $regex: new RegExp(`^${topic}$`, "i") };
  if (difficulty) query.difficulty = difficulty;
  if (type) query.type = type;

  const [questions, total] = await Promise.all([
    Question.find(query)
      .select("-correctAnswer -explanation -sourceExcerpt -cacheKey")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Question.countDocuments(query),
  ]);

  return {
    data: questions.map((q) => ({
      id: q._id.toString(),
      type: q.type,
      difficulty: q.difficulty,
      text: q.text,
      options: q.options,
      topic: q.topic,
      materialId: q.materialId.toString(),
      createdAt: q.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single question without answer.
 */
export async function getQuestionById(questionId: string, userId: string) {
  const question = await Question.findOne({
    _id: questionId,
    userId,
  })
    .select("-correctAnswer -explanation -sourceExcerpt -cacheKey")
    .lean();

  if (!question) {
    throw new AppError("Question not found", 404, "QUESTION_NOT_FOUND");
  }

  return {
    id: question._id.toString(),
    type: question.type,
    difficulty: question.difficulty,
    text: question.text,
    options: question.options,
    topic: question.topic,
    materialId: question.materialId.toString(),
    createdAt: question.createdAt,
  };
}

/**
 * Get a single question with answer (for review mode).
 */
export async function getQuestionWithAnswer(questionId: string, userId: string) {
  const question = await Question.findOne({
    _id: questionId,
    userId,
  }).lean();

  if (!question) {
    throw new AppError("Question not found", 404, "QUESTION_NOT_FOUND");
  }

  return {
    id: question._id.toString(),
    type: question.type,
    difficulty: question.difficulty,
    text: question.text,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    topic: question.topic,
    materialId: question.materialId.toString(),
    createdAt: question.createdAt,
  };
}

/**
 * Delete a single question.
 */
export async function deleteQuestion(questionId: string, userId: string) {
  const result = await Question.deleteOne({
    _id: questionId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError("Question not found", 404, "QUESTION_NOT_FOUND");
  }
}

/**
 * Delete multiple questions.
 */
export async function deleteQuestionsBatch(ids: string[], userId: string) {
  const result = await Question.deleteMany({
    _id: { $in: ids },
    userId,
  });

  return { deleted: result.deletedCount };
}

/**
 * Delete all questions for a material (used in cascade delete).
 */
export async function deleteQuestionsForMaterial(
  materialId: string,
  userId: string
) {
  const result = await Question.deleteMany({ materialId, userId });
  logger.info(
    `Deleted ${result.deletedCount} questions for material ${materialId}`
  );
  return result.deletedCount;
}
