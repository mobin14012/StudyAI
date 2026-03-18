import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

// GET /api/health — Health check for monitoring services
router.get("/", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "connected" : "disconnected";
  
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

export default router;
