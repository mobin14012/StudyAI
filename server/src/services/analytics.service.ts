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

const WEAK_THRESHOLD = 70; // Below 70% = weak
const MASTERY_THRESHOLD = 80; // Above 80% recent = mastered
const MASTERY_MIN_ATTEMPTS = 10;
const MIN_ATTEMPTS_FOR_CLASSIFICATION = 3;

/**
 * Get full analytics dashboard with all stats in one query.
 */
export async function getAnalyticsDashboard(
  userId: string
): Promise<AnalyticsDashboard> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Single facet aggregation for performance (ANLT-07)
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
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
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
        ? Math.round(
            (overviewRaw.correctCount / overviewRaw.totalAttempts) * 1000
          ) / 10
        : 0,
  };

  // Process topic stats with weak/mastery classification
  const topicBreakdown: TopicStats[] = data.topicStats.map(
    (t: {
      _id: string;
      total: number;
      correct: number;
      attempts: { isCorrect: boolean }[];
    }) => {
      const accuracy = Math.round((t.correct / t.total) * 1000) / 10;

      // Calculate recent accuracy (last 10 attempts)
      const recentAttempts = t.attempts.slice(0, MASTERY_MIN_ATTEMPTS);
      const recentCorrect = recentAttempts.filter((a) => a.isCorrect).length;
      const recentAccuracy =
        recentAttempts.length > 0
          ? Math.round((recentCorrect / recentAttempts.length) * 1000) / 10
          : 0;

      // Classification requires minimum attempts
      const isWeak =
        accuracy < WEAK_THRESHOLD && t.total >= MIN_ATTEMPTS_FOR_CLASSIFICATION;
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

  // Extract weak topics (weak but not yet mastered)
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
