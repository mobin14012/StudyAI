import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { globalLimiter } from "./middleware/rate-limit";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import materialRoutes from "./routes/material.routes";
import questionRoutes from "./routes/question.routes";
import practiceRoutes from "./routes/practice.routes";
import analyticsRoutes from "./routes/analytics.routes";
import tutorRoutes from "./routes/tutor.routes";
import bookmarkRoutes from "./routes/bookmark.routes";
import noteRoutes from "./routes/note.routes";

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(compression());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(globalLimiter);

// Health check (no auth required, before other routes)
app.use("/api/health", healthRoutes);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/notes", noteRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
