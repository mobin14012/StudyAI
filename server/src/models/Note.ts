import mongoose, { Schema, Document, Types } from "mongoose";

export interface INote extends Document {
  userId: Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search (XTRA-05)
noteSchema.index({ title: "text", content: "text" });

export const Note = mongoose.model<INote>("Note", noteSchema);
