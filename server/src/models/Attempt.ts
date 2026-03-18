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
