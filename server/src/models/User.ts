import mongoose, { Schema, Document } from "mongoose";

interface IRefreshToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  level: "junior" | "senior";
  refreshTokens: IRefreshToken[];
  dailyGoal: number;
  lastActivityDate?: Date;
  currentStreak: number;
  longestStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    level: {
      type: String,
      enum: ["junior", "senior"],
      required: true,
      default: "junior",
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
    },
    dailyGoal: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastActivityDate: {
      type: Date,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });

// Clean up expired tokens and limit to 5 most recent on save
userSchema.pre("save", function (next) {
  const now = new Date();
  this.refreshTokens = this.refreshTokens
    .filter((rt) => rt.expiresAt > now)
    .slice(-5);
  next();
});

export const User = mongoose.model<IUser>("User", userSchema);
