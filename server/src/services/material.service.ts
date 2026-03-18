import { Material, IMaterial } from "../models/Material";
import { Question } from "../models/Question";
import { extractTextFromPdf } from "../utils/pdf-parser";
import { detectTopics } from "./ai/topic-detector";
import { generateSummary as generateAiSummary } from "./ai/summarizer";
import { AppError } from "../middleware/error-handler";
import { logger } from "../config/logger";

const MIN_TEXT_LENGTH_TEXT_FILE = 10;

interface UploadResult {
  id: string;
  filename: string;
  fileType: "pdf" | "text";
  fileSize: number;
  textPreview: string;
  textLength: number;
  topics: Array<{ name: string; selected: boolean }>;
  status: string;
  createdAt: Date;
}

/**
 * Process an uploaded file: extract text, detect topics, save material.
 */
export async function processUpload(
  userId: string,
  file: Express.Multer.File
): Promise<UploadResult> {
  const isPdf = file.mimetype === "application/pdf";
  const fileType = isPdf ? "pdf" : "text";

  // Step 1: Extract text
  let extractedText: string;

  if (isPdf) {
    extractedText = await extractTextFromPdf(file.buffer);
  } else {
    extractedText = file.buffer.toString("utf-8").trim();
    if (extractedText.length < MIN_TEXT_LENGTH_TEXT_FILE) {
      throw new AppError(
        "Text content is too short. Please provide at least 10 characters.",
        400,
        "TEXT_TOO_SHORT"
      );
    }
  }

  // Step 2: Create material document with processing status
  const material = new Material({
    userId,
    filename: file.originalname,
    fileType,
    fileSize: file.size,
    extractedText,
    textLength: extractedText.length,
    status: "processing",
  });
  await material.save();

  // Step 3: Detect topics via AI
  try {
    const topicNames = await detectTopics(extractedText);
    material.topics = topicNames.map((name) => ({
      name,
      selected: true,
    }));
    material.status = "ready";
    await material.save();
  } catch (error: any) {
    logger.error(`Topic detection failed for material ${material._id}:`, error);
    material.status = "error";
    material.errorMessage =
      error instanceof AppError
        ? error.message
        : "Topic detection failed. Please try again.";
    await material.save();
    throw error;
  }

  return {
    id: material._id.toString(),
    filename: material.filename,
    fileType: material.fileType,
    fileSize: material.fileSize,
    textPreview: material.extractedText.slice(0, 500),
    textLength: material.textLength,
    topics: material.topics.map((t) => ({
      name: t.name,
      selected: t.selected,
    })),
    status: material.status,
    createdAt: material.createdAt,
  };
}

/**
 * Get paginated list of materials for a user.
 * Returns lightweight data (no extractedText).
 */
export async function getMaterials(
  userId: string,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;
  const [materials, total] = await Promise.all([
    Material.find({ userId })
      .select("-extractedText -summary")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Material.countDocuments({ userId }),
  ]);

  return {
    data: materials.map((m) => ({
      id: m._id.toString(),
      filename: m.filename,
      fileType: m.fileType,
      fileSize: m.fileSize,
      textLength: m.textLength,
      topicCount: m.topics.length,
      status: m.status,
      errorMessage: m.errorMessage,
      createdAt: m.createdAt,
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
 * Get a single material by ID, scoped to user.
 */
export async function getMaterialById(
  materialId: string,
  userId: string
) {
  const material = await Material.findOne({
    _id: materialId,
    userId,
  }).lean();

  if (!material) {
    throw new AppError("Material not found", 404, "MATERIAL_NOT_FOUND");
  }

  return {
    id: material._id.toString(),
    filename: material.filename,
    fileType: material.fileType,
    fileSize: material.fileSize,
    extractedText: material.extractedText,
    textPreview: material.extractedText.slice(0, 500),
    textLength: material.textLength,
    topics: material.topics.map((t) => ({
      name: t.name,
      selected: t.selected,
    })),
    status: material.status,
    errorMessage: material.errorMessage,
    summary: material.summary,
    summaryGeneratedAt: material.summaryGeneratedAt,
    createdAt: material.createdAt,
  };
}

/**
 * Update topic selections for a material.
 */
export async function updateTopicSelections(
  materialId: string,
  userId: string,
  topics: Array<{ name: string; selected: boolean }>
) {
  const material = await Material.findOne({
    _id: materialId,
    userId,
  });

  if (!material) {
    throw new AppError("Material not found", 404, "MATERIAL_NOT_FOUND");
  }

  // Update selection status for each topic
  material.topics = topics.map((t) => ({
    name: t.name,
    selected: t.selected,
  }));
  await material.save();

  return {
    id: material._id.toString(),
    filename: material.filename,
    fileType: material.fileType,
    fileSize: material.fileSize,
    extractedText: material.extractedText,
    textPreview: material.extractedText.slice(0, 500),
    textLength: material.textLength,
    topics: material.topics.map((t) => ({
      name: t.name,
      selected: t.selected,
    })),
    status: material.status,
    summary: material.summary,
    summaryGeneratedAt: material.summaryGeneratedAt,
    createdAt: material.createdAt,
  };
}

/**
 * Generate or return cached summary for a material.
 */
export async function getOrGenerateSummary(
  materialId: string,
  userId: string
) {
  const material = await Material.findOne({
    _id: materialId,
    userId,
  });

  if (!material) {
    throw new AppError("Material not found", 404, "MATERIAL_NOT_FOUND");
  }

  if (material.status !== "ready") {
    throw new AppError(
      "Material is not ready for summarization.",
      400,
      "MATERIAL_NOT_READY"
    );
  }

  // Return cached summary if available
  if (material.summary && material.summaryGeneratedAt) {
    return {
      summary: material.summary,
      generatedAt: material.summaryGeneratedAt,
      cached: true,
    };
  }

  // Generate new summary
  const summary = await generateAiSummary(material.extractedText);
  material.summary = summary;
  material.summaryGeneratedAt = new Date();
  await material.save();

  return {
    summary: material.summary,
    generatedAt: material.summaryGeneratedAt,
    cached: false,
  };
}

/**
 * Delete a material by ID, scoped to user.
 * Also deletes all associated questions (cascade delete).
 */
export async function deleteMaterial(
  materialId: string,
  userId: string
): Promise<void> {
  const result = await Material.deleteOne({
    _id: materialId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError("Material not found", 404, "MATERIAL_NOT_FOUND");
  }

  // Cascade delete all questions for this material
  const questionResult = await Question.deleteMany({ materialId, userId });
  if (questionResult.deletedCount > 0) {
    logger.info(
      `Deleted ${questionResult.deletedCount} questions for material ${materialId}`
    );
  }
}
