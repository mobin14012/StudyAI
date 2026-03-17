import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";
import { env } from "../config/env";
import { AppError } from "../middleware/error-handler";

const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function generateAccessToken(user: IUser): string {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      level: user.level,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sanitizeUser(user: IUser) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    level: user.level,
    createdAt: user.createdAt,
  };
}

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  level: "junior" | "senior";
}) {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409, "EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);
  const user = new User({
    email: data.email,
    passwordHash,
    name: data.name,
    level: data.level,
  });

  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(refreshToken);
  user.refreshTokens.push({
    token: hashedRefreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  });

  await user.save();

  const accessToken = generateAccessToken(user);
  return { accessToken, refreshToken, user: sanitizeUser(user) };
}

export async function loginUser(data: { email: string; password: string }) {
  const user = await User.findOne({ email: data.email });
  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(refreshToken);
  user.refreshTokens.push({
    token: hashedRefreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  });
  await user.save();

  const accessToken = generateAccessToken(user);
  return { accessToken, refreshToken, user: sanitizeUser(user) };
}

export async function refreshTokens(rawRefreshToken: string) {
  const hashedToken = hashToken(rawRefreshToken);
  const user = await User.findOne({ "refreshTokens.token": hashedToken });

  if (!user) {
    throw new AppError("Session expired, please log in again", 401, "INVALID_REFRESH_TOKEN");
  }

  const tokenEntry = user.refreshTokens.find((rt) => rt.token === hashedToken);
  if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
    user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== hashedToken);
    await user.save();
    throw new AppError("Session expired, please log in again", 401, "INVALID_REFRESH_TOKEN");
  }

  // Remove the used refresh token (rotation)
  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== hashedToken);

  // Generate new tokens
  const newRefreshToken = generateRefreshToken();
  const hashedNewRefreshToken = hashToken(newRefreshToken);
  user.refreshTokens.push({
    token: hashedNewRefreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  });
  await user.save();

  const accessToken = generateAccessToken(user);
  return { accessToken, refreshToken: newRefreshToken, user: sanitizeUser(user) };
}

export async function logoutUser(userId: string, rawRefreshToken: string) {
  const hashedToken = hashToken(rawRefreshToken);
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { token: hashedToken } } }
  );
}
