---
plan: 05-01
title: Backend Analytics Service
phase: 05-adaptive-analytics
requirements: [ADPT-01, ADPT-02, ADPT-04, ADPT-05, ADPT-06, ANLT-01, ANLT-02, ANLT-03, ANLT-04, ANLT-07]
depends-on: Phase 4 complete
estimated-tasks: 4
---

# Plan 05-01: Backend Analytics Service

## Goal
Implement the analytics service with MongoDB aggregation pipelines for dashboard stats, topic breakdown, weak topic tracking, mastery graduation, and adaptive question generation.

## Requirements Addressed
- **ADPT-01**: Track incorrect answers per topic (already done, enhanced)
- **ADPT-02**: Maintain weak topic list per user
- **ADPT-04**: Track recent accuracy per topic (not just lifetime)
- **ADPT-05**: Topics graduate when recent accuracy > mastery threshold
- **ADPT-06**: Generate new questions if pool insufficient
- **ANLT-01-04**: Overview stats and weak topics
- **ANLT-07**: Dashboard loads fast with optimized aggregation

---

## Tasks

### Task 1: Create Analytics Service
**File:** `server/src/services/analytics.service.ts`

```typescript
import { Types } from "mongoose";
import { Attempt } from "../models/Attempt";
import { logger } from "../config/logger";

interface OverviewStats {
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
}

interface TopicStats {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
  isWeak: boolean;
  isMastered: boolean;
  recentAccuracy: number;
}

interface DailyProgress {
  date: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface AnalyticsDashboard {
  overview: OverviewStats;
  topicBreakdown: TopicStats[];
  weakTopics: TopicStats[];
  dailyProgress: DailyProgress[];
  lastUpdated: string;
}

const WEAK_THRESHOLD = 70;     // Below 70% = weak
const MASTERY_THRESHOLD = 80;  // Above 80% recent = mastered
const MASTERY_MIN_ATTEMPTS = 10;

/**
 * Get full analytics dashboard with all stats in one query.
 */
export async function getAnalyticsDashboard(
  userId: string
): Promise<AnalyticsDashboard> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Single facet aggregation for performance
  const results = await Attempt.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              totalAttempts: { $sum: 1 },
              correctCount: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            },
          },
        ],
        topicStats: [
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$topic",
              total: { $sum: 1 },
              correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
              attempts: { $push: { isCorrect: "$isCorrect" } },
            },
          },
        ],
        dailyProgress: [
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              total: { $sum: 1 },
              correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  const data = results[0];

  // Process overview
  const overviewRaw = data.overview[0] || { totalAttempts: 0, correctCount: 0 };
  const overview: OverviewStats = {
    totalAttempts: overviewRaw.totalAttempts,
    correctCount: overviewRaw.correctCount,
    incorrectCount: overviewRaw.totalAttempts - overviewRaw.correctCount,
    accuracyPercentage:
      overviewRaw.totalAttempts > 0
        ? Math.round((overviewRaw.correctCount / overviewRaw.totalAttempts) * 1000) / 10
        : 0,
  };

  // Process topic stats with weak/mastery classification
  const topicBreakdown: TopicStats[] = data.topicStats.map(
    (t: { _id: string; total: number; correct: number; attempts: { isCorrect: boolean }[] }) => {
      const accuracy = Math.round((t.correct / t.total) * 1000) / 10;

      // Calculate recent accuracy (last 10 attempts)
      const recentAttempts = t.attempts.slice(0, MASTERY_MIN_ATTEMPTS);
      const recentCorrect = recentAttempts.filter((a) => a.isCorrect).length;
      const recentAccuracy =
        recentAttempts.length > 0
          ? Math.round((recentCorrect / recentAttempts.length) * 1000) / 10
          : 0;

      const isWeak = accuracy < WEAK_THRESHOLD && t.total >= 3;
      const isMastered =
        t.total >= MASTERY_MIN_ATTEMPTS && recentAccuracy >= MASTERY_THRESHOLD;

      return {
        topic: t._id,
        total: t.total,
        correct: t.correct,
        accuracy,
        isWeak,
        isMastered,
        recentAccuracy,
      };
    }
  );

  // Sort by accuracy ascending (weakest first)
  topicBreakdown.sort((a, b) => a.accuracy - b.accuracy);

  // Extract weak topics
  const weakTopics = topicBreakdown.filter((t) => t.isWeak && !t.isMastered);

  // Process daily progress
  const dailyProgress: DailyProgress[] = data.dailyProgress.map(
    (d: { _id: string; total: number; correct: number }) => ({
      date: d._id,
      total: d.total,
      correct: d.correct,
      accuracy: Math.round((d.correct / d.total) * 1000) / 10,
    })
  );

  logger.info(`Analytics dashboard generated for user ${userId}`);

  return {
    overview,
    topicBreakdown,
    weakTopics,
    dailyProgress,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get weak topics only (for practice mode selection).
 */
export async function getWeakTopicsWithStats(
  userId: string
): Promise<TopicStats[]> {
  const dashboard = await getAnalyticsDashboard(userId);
  return dashboard.weakTopics;
}

/**
 * Get stats for a single topic.
 */
export async function getTopicStats(
  userId: string,
  topic: string
): Promise<TopicStats | null> {
  const dashboard = await getAnalyticsDashboard(userId);
  return dashboard.topicBreakdown.find((t) => t.topic === topic) || null;
}
```

---

### Task 2: Create Analytics Routes
**File:** `server/src/routes/analytics.routes.ts`

```typescript
import { Router, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  getAnalyticsDashboard,
  getWeakTopicsWithStats,
  getTopicStats,
} from "../services/analytics.service";
import { AuthRequest } from "../types/index";

const router = Router();

// All analytics routes require authentication
router.use(authenticate as any);

// GET /api/analytics/dashboard — Get full analytics dashboard
router.get(
  "/dashboard",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dashboard = await getAnalyticsDashboard(req.userId!);
      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/analytics/weak-topics — Get weak topics only
router.get(
  "/weak-topics",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const weakTopics = await getWeakTopicsWithStats(req.userId!);
      res.json({
        success: true,
        data: weakTopics,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/analytics/topic/:topic — Get stats for single topic
router.get(
  "/topic/:topic",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await getTopicStats(req.userId!, req.params.topic);
      if (!stats) {
        return res.status(404).json({
          success: false,
          error: { code: "TOPIC_NOT_FOUND", message: "No data for this topic" },
        });
      }
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

---

### Task 3: Update Practice Service for Adaptive Generation (ADPT-06)
**File:** `server/src/services/practice.service.ts`
**Change:** Enhance weak-topic mode to generate questions if insufficient

Add to existing service:

```typescript
import { Material } from "../models/Material";
import { generateOrGetCachedQuestions } from "./question.service";

/**
 * Get materials that contain specific topics.
 */
async function getMaterialsWithTopics(
  userId: string,
  topics: string[]
): Promise<Array<{ materialId: string; topic: string; extractedText: string }>> {
  const materials = await Material.find({
    userId: new Types.ObjectId(userId),
    status: "ready",
    "topics.name": { $in: topics },
    "topics.selected": true,
  }).lean();

  const result: Array<{ materialId: string; topic: string; extractedText: string }> = [];

  for (const material of materials) {
    for (const t of material.topics) {
      if (topics.includes(t.name) && t.selected) {
        result.push({
          materialId: material._id.toString(),
          topic: t.name,
          extractedText: material.extractedText,
        });
      }
    }
  }

  return result;
}

// In startPracticeSession, update weak_topic mode:
// After getting questions, if insufficient:
if (questions.length < questionCount) {
  const deficit = questionCount - questions.length;
  const materialsWithWeakTopics = await getMaterialsWithTopics(userId, weakTopics);

  if (materialsWithWeakTopics.length > 0) {
    logger.info(`Generating ${deficit} more questions for weak topics`);

    // Generate more questions
    const countPerMaterial = Math.ceil(deficit / materialsWithWeakTopics.length);
    
    for (const { materialId, topic } of materialsWithWeakTopics.slice(0, 3)) {
      try {
        await generateOrGetCachedQuestions(
          {
            materialId,
            topic,
            types: ["mcq", "short_answer", "true_false"],
            count: countPerMaterial,
          },
          userId
        );
      } catch (error) {
        logger.warn(`Failed to generate questions for topic ${topic}: ${error}`);
      }
    }

    // Refetch questions
    questions = await Question.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          topic: { $in: weakTopics },
        },
      },
      { $sample: { size: questionCount } },
    ]);
  }
}
```

---

### Task 4: Register Analytics Routes in App
**File:** `server/src/app.ts`
**Change:** Add analytics routes import and registration

```typescript
// Add import
import analyticsRoutes from "./routes/analytics.routes";

// Add route (after practice)
app.use("/api/analytics", analyticsRoutes);
```

---

## Verification

After completing all tasks:

```bash
cd server && npm run build
```

Expected: 0 errors

---

## Files Created/Modified

| File | Action |
|------|--------|
| `server/src/services/analytics.service.ts` | CREATE |
| `server/src/routes/analytics.routes.ts` | CREATE |
| `server/src/services/practice.service.ts` | MODIFY |
| `server/src/app.ts` | MODIFY |
