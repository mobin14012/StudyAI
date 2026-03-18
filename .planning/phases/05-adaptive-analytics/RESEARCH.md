---
phase: 05-adaptive-analytics
type: research
requirements: [ADPT-01, ADPT-02, ADPT-03, ADPT-04, ADPT-05, ADPT-06, ANLT-01, ANLT-02, ANLT-03, ANLT-04, ANLT-05, ANLT-06, ANLT-07]
depends-on: Phase 4 (Practice Engine) - complete
created: 2026-03-18
---

# Phase 5 Research: Adaptive Learning & Analytics

**Goal:** Implement weak topic tracking with mastery graduation, adaptive question generation for weak areas, and a full analytics dashboard with charts and trend data.

**Requirements covered:** ADPT-01 through ADPT-06, ANLT-01 through ANLT-07 (13 total)

---

## 1. Adaptive Learning Requirements Analysis

### 1.1 Weak Topic Tracking

| Req | Description | Implementation |
|-----|-------------|----------------|
| ADPT-01 | Track incorrect answers per topic | Already done - Attempt model stores `topic` + `isCorrect` |
| ADPT-02 | Maintain weak topic list per user | Aggregation query on Attempt collection |
| ADPT-03 | Weak topic drill generates questions from weak topics | Already implemented in `practice.service.ts` |
| ADPT-04 | Track recent accuracy (not just lifetime) | Filter by date range (e.g., last 7/30 days) |
| ADPT-05 | Topics graduate when recent accuracy > mastery threshold | 80% accuracy over last 10 attempts = mastered |
| ADPT-06 | Generate new questions if pool insufficient | Call question generator when starting weak-topic drill |

### 1.2 Analytics Requirements

| Req | Description | Implementation |
|-----|-------------|----------------|
| ANLT-01 | Total questions attempted | `Attempt.countDocuments({ userId })` |
| ANLT-02 | Correct vs incorrect count | Aggregation with `$group` |
| ANLT-03 | Overall accuracy percentage | `correct / total * 100` |
| ANLT-04 | Weak topics list with per-topic accuracy | Topic aggregation with accuracy calc |
| ANLT-05 | Per-topic accuracy breakdown chart | Return all topics with accuracy |
| ANLT-06 | Progress over time (trend chart) | Daily/weekly aggregation |
| ANLT-07 | Dashboard loads fast with pre-aggregated data | Single optimized aggregation query |

---

## 2. Analytics Service Design

### 2.1 Analytics Data Model

No new collection needed - all analytics derived from existing `Attempt` collection via aggregation.

### 2.2 Analytics Service - `server/src/services/analytics.service.ts`

```typescript
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
  isWeak: boolean;        // accuracy < 70%
  isMastered: boolean;    // accuracy >= 80% over last 10
  recentAccuracy: number; // last 10 attempts
}

interface DailyProgress {
  date: string;           // YYYY-MM-DD
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
```

### 2.3 Aggregation Pipelines

#### Overview Stats Pipeline
```typescript
const overviewPipeline = [
  { $match: { userId: new ObjectId(userId) } },
  {
    $group: {
      _id: null,
      totalAttempts: { $sum: 1 },
      correctCount: { $sum: { $cond: ["$isCorrect", 1, 0] } },
    },
  },
  {
    $project: {
      _id: 0,
      totalAttempts: 1,
      correctCount: 1,
      incorrectCount: { $subtract: ["$totalAttempts", "$correctCount"] },
      accuracyPercentage: {
        $round: [{ $multiply: [{ $divide: ["$correctCount", "$totalAttempts"] }, 100] }, 1],
      },
    },
  },
];
```

#### Topic Breakdown Pipeline
```typescript
const topicPipeline = [
  { $match: { userId: new ObjectId(userId) } },
  {
    $group: {
      _id: "$topic",
      total: { $sum: 1 },
      correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
    },
  },
  {
    $project: {
      topic: "$_id",
      total: 1,
      correct: 1,
      accuracy: {
        $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 1],
      },
    },
  },
  { $sort: { accuracy: 1 } }, // Weakest first
];
```

#### Recent Accuracy Pipeline (for mastery check)
```typescript
const recentAccuracyPipeline = [
  { $match: { userId: new ObjectId(userId) } },
  { $sort: { createdAt: -1 } },
  {
    $group: {
      _id: "$topic",
      recentAttempts: { $push: { isCorrect: "$isCorrect" } },
    },
  },
  {
    $project: {
      topic: "$_id",
      last10: { $slice: ["$recentAttempts", 10] },
    },
  },
  {
    $project: {
      topic: 1,
      recentCorrect: {
        $size: {
          $filter: {
            input: "$last10",
            cond: "$$this.isCorrect",
          },
        },
      },
      recentTotal: { $size: "$last10" },
    },
  },
  {
    $project: {
      topic: 1,
      recentAccuracy: {
        $cond: [
          { $gt: ["$recentTotal", 0] },
          { $round: [{ $multiply: [{ $divide: ["$recentCorrect", "$recentTotal"] }, 100] }, 1] },
          0,
        ],
      },
    },
  },
];
```

#### Daily Progress Pipeline (last 30 days)
```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const dailyProgressPipeline = [
  { 
    $match: { 
      userId: new ObjectId(userId),
      createdAt: { $gte: thirtyDaysAgo },
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      total: { $sum: 1 },
      correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
    },
  },
  {
    $project: {
      date: "$_id",
      total: 1,
      correct: 1,
      accuracy: {
        $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 1],
      },
    },
  },
  { $sort: { date: 1 } },
];
```

---

## 3. Weak Topic Graduation Logic

### 3.1 Mastery Threshold

- **Weak:** Topic accuracy < 70%
- **Mastered:** Recent accuracy >= 80% over last 10 attempts
- **Normal:** Between weak and mastered thresholds

### 3.2 Graduation Check

```typescript
function checkMasteryStatus(
  lifetimeAccuracy: number,
  recentAccuracy: number,
  totalAttempts: number
): "weak" | "normal" | "mastered" {
  // Need at least 3 attempts to classify
  if (totalAttempts < 3) return "normal";
  
  // Check mastery first (recent performance)
  if (totalAttempts >= 10 && recentAccuracy >= 80) {
    return "mastered";
  }
  
  // Check weakness (lifetime performance)
  if (lifetimeAccuracy < 70) {
    return "weak";
  }
  
  return "normal";
}
```

---

## 4. API Endpoint Design

### 4.1 Routes - `server/src/routes/analytics.routes.ts`

| Method | Path | Description | Req |
|--------|------|-------------|-----|
| `GET` | `/api/analytics/dashboard` | Get full analytics dashboard | ANLT-01-07 |
| `GET` | `/api/analytics/weak-topics` | Get weak topics only | ADPT-02, ANLT-04 |
| `GET` | `/api/analytics/topic/:topic` | Get stats for single topic | - |

### 4.2 Response Shapes

**GET `/api/analytics/dashboard`**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalAttempts": 150,
      "correctCount": 105,
      "incorrectCount": 45,
      "accuracyPercentage": 70.0
    },
    "topicBreakdown": [
      {
        "topic": "Photosynthesis",
        "total": 30,
        "correct": 15,
        "accuracy": 50.0,
        "isWeak": true,
        "isMastered": false,
        "recentAccuracy": 60.0
      }
    ],
    "weakTopics": [
      { "topic": "Photosynthesis", "accuracy": 50.0, "recentAccuracy": 60.0 }
    ],
    "dailyProgress": [
      { "date": "2026-03-18", "total": 20, "correct": 15, "accuracy": 75.0 }
    ],
    "lastUpdated": "2026-03-18T12:00:00Z"
  }
}
```

---

## 5. Frontend Analytics Dashboard

### 5.1 Component Structure

```
client/src/
├── api/
│   └── analytics.ts                   # API functions
├── hooks/
│   └── use-analytics.ts               # TanStack Query hooks
├── components/
│   └── analytics/
│       ├── OverviewCards.tsx          # Total/correct/accuracy cards
│       ├── TopicAccuracyChart.tsx     # Bar chart by topic
│       ├── ProgressTrendChart.tsx     # Line chart over time
│       ├── WeakTopicsList.tsx         # Weak topics with drill buttons
│       └── TopicStatusBadge.tsx       # Weak/Normal/Mastered badge
├── pages/
│   └── ProgressPage.tsx               # Updated with analytics
```

### 5.2 Chart Library

Use **Recharts** - already commonly used with React, good TypeScript support, responsive.

```bash
npm install recharts
```

### 5.3 Client Types

```typescript
// Add to client/src/types/index.ts

export interface OverviewStats {
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
}

export interface TopicStats {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
  isWeak: boolean;
  isMastered: boolean;
  recentAccuracy: number;
}

export interface DailyProgress {
  date: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface AnalyticsDashboard {
  overview: OverviewStats;
  topicBreakdown: TopicStats[];
  weakTopics: TopicStats[];
  dailyProgress: DailyProgress[];
  lastUpdated: string;
}
```

---

## 6. Adaptive Question Generation (ADPT-06)

### 6.1 Problem

When starting weak-topic drill, if existing question pool is insufficient, generate more.

### 6.2 Solution

In `practice.service.ts` `startPracticeSession`:

```typescript
// For weak_topic mode
const weakTopics = await getWeakTopics(userId);
let questions = await getQuestionsForWeakTopics(userId, weakTopics, questionCount);

// If insufficient questions, trigger generation
if (questions.length < questionCount) {
  const deficit = questionCount - questions.length;
  
  // Get materials that have weak topics
  const materialsWithWeakTopics = await getMaterialsWithTopics(userId, weakTopics);
  
  if (materialsWithWeakTopics.length > 0) {
    // Generate more questions for weak topics
    for (const { materialId, topic } of materialsWithWeakTopics) {
      await generateOrGetCachedQuestions({
        materialId,
        topic,
        types: ["mcq", "short_answer", "true_false"],
        count: Math.ceil(deficit / materialsWithWeakTopics.length),
      }, userId);
    }
    
    // Refetch questions
    questions = await getQuestionsForWeakTopics(userId, weakTopics, questionCount);
  }
}
```

---

## 7. Performance Optimization (ANLT-07)

### 7.1 Strategies

1. **Single aggregation query** - Combine overview + topics + daily in one call using `$facet`
2. **Indexed fields** - Already indexed: `userId`, `topic`, `createdAt`, `isCorrect`
3. **Limit daily progress** - Only last 30 days
4. **Cache in memory** - Optional: Redis/in-memory cache for 5 min TTL

### 7.2 Combined Facet Pipeline

```typescript
const dashboardPipeline = [
  { $match: { userId: new ObjectId(userId) } },
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
      topicBreakdown: [
        {
          $group: {
            _id: "$topic",
            total: { $sum: 1 },
            correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
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
];
```

---

## 8. File Inventory

### New Server Files

| File | Purpose |
|------|---------|
| `server/src/services/analytics.service.ts` | Analytics aggregation logic |
| `server/src/routes/analytics.routes.ts` | Analytics REST endpoints |

### Modified Server Files

| File | Changes |
|------|---------|
| `server/src/app.ts` | Register analytics routes |
| `server/src/services/practice.service.ts` | Add adaptive question generation |

### New Client Files

| File | Purpose |
|------|---------|
| `client/src/api/analytics.ts` | Analytics API functions |
| `client/src/hooks/use-analytics.ts` | Analytics hooks |
| `client/src/types/index.ts` | Add analytics types |
| `client/src/components/analytics/OverviewCards.tsx` | Stats cards |
| `client/src/components/analytics/TopicAccuracyChart.tsx` | Bar chart |
| `client/src/components/analytics/ProgressTrendChart.tsx` | Line chart |
| `client/src/components/analytics/WeakTopicsList.tsx` | Weak topics list |
| `client/src/components/analytics/TopicStatusBadge.tsx` | Status badge |

### Modified Client Files

| File | Changes |
|------|---------|
| `client/src/pages/ProgressPage.tsx` | Replace placeholder with dashboard |

---

## 9. Recommended Plan Structure

### Plan 05-01: Backend Analytics Service
- Create analytics service with aggregation pipelines
- Create analytics routes
- Update practice service with adaptive generation
- Register routes in app.ts

### Plan 05-02: Frontend Analytics Dashboard
- Install recharts
- Add analytics types
- Create API functions and hooks
- Create analytics components (cards, charts, lists)
- Update ProgressPage

---

## 10. Validation Checklist

| Req | Description | Validation Method |
|-----|-------------|-------------------|
| ADPT-01 | Track incorrect answers per topic | Already done via Attempt model |
| ADPT-02 | Maintain weak topic list | Dashboard shows weak topics |
| ADPT-03 | Weak topic drill mode | Already implemented in Phase 4 |
| ADPT-04 | Track recent accuracy | `recentAccuracy` field in topic stats |
| ADPT-05 | Topics graduate from weak | `isMastered` flag when recent >= 80% |
| ADPT-06 | Generate new questions if insufficient | Auto-generation in weak-topic mode |
| ANLT-01 | Total questions attempted | `overview.totalAttempts` |
| ANLT-02 | Correct vs incorrect count | `overview.correctCount/incorrectCount` |
| ANLT-03 | Overall accuracy percentage | `overview.accuracyPercentage` |
| ANLT-04 | Weak topics list with accuracy | `weakTopics` array |
| ANLT-05 | Per-topic accuracy chart | `TopicAccuracyChart` component |
| ANLT-06 | Progress over time chart | `ProgressTrendChart` component |
| ANLT-07 | Fast dashboard load | Single `$facet` aggregation |

---

*Research completed: 2026-03-18*
*Ready for planning phase.*
