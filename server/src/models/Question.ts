import mongoose, { Schema, Document, Types } from "mongoose";

export type QuestionType = "mcq" | "short_answer" | "true_false";
export type DifficultyLevel = "easy" | "medium" | "hard";

export interface IQuestion extends Document {
  userId: Types.ObjectId;
  materialId: Types.ObjectId;
  type: QuestionType;
  difficulty: DifficultyLevel;
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  sourceExcerpt?: string;
  cacheKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["mcq", "short_answer", "true_false"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    options: {
      type: [String],
      validate: {
        validator: function (this: IQuestion, v: string[]) {
          // Options required only for MCQ, must have exactly 4
          if (this.type === "mcq") {
            return v && v.length === 4;
          }
          return true;
        },
        message: "MCQ questions must have exactly 4 options",
      },
    },
    correctAnswer: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    explanation: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    topic: {
      type: String,
      required: true,
      index: true,
    },
    sourceExcerpt: {
      type: String,
      maxlength: 2000,
    },
    cacheKey: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
questionSchema.index({ userId: 1, materialId: 1, createdAt: -1 });
questionSchema.index({ userId: 1, topic: 1 });
questionSchema.index({ materialId: 1, topic: 1, difficulty: 1, type: 1 });

export const Question = mongoose.model<IQuestion>("Question", questionSchema);
