import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITopic {
  name: string;
  selected: boolean;
}

export type MaterialStatus = "processing" | "ready" | "error";
export type MaterialFileType = "pdf" | "text";

export interface IMaterial extends Document {
  userId: Types.ObjectId;
  filename: string;
  fileType: MaterialFileType;
  fileSize: number;
  extractedText: string;
  textLength: number;
  topics: ITopic[];
  status: MaterialStatus;
  errorMessage?: string;
  summary?: string;
  summaryGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    name: { type: String, required: true, trim: true },
    selected: { type: Boolean, default: true },
  },
  { _id: false }
);

const materialSchema = new Schema<IMaterial>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    fileType: {
      type: String,
      enum: ["pdf", "text"],
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    textLength: {
      type: Number,
      required: true,
    },
    topics: {
      type: [topicSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["processing", "ready", "error"],
      default: "processing",
    },
    errorMessage: {
      type: String,
    },
    summary: {
      type: String,
    },
    summaryGeneratedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for listing user's materials sorted by date
materialSchema.index({ userId: 1, createdAt: -1 });

export const Material = mongoose.model<IMaterial>("Material", materialSchema);
