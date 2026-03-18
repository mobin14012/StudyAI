---
plan: 05-02
title: Frontend Analytics Dashboard
phase: 05-adaptive-analytics
requirements: [ANLT-01, ANLT-02, ANLT-03, ANLT-04, ANLT-05, ANLT-06]
depends-on: Plan 05-01 (Backend)
estimated-tasks: 6
---

# Plan 05-02: Frontend Analytics Dashboard

## Goal
Build the complete analytics dashboard UI with overview cards, per-topic accuracy bar chart, progress trend line chart, and weak topics list with drill buttons.

## Requirements Addressed
- **ANLT-01**: Total questions attempted (OverviewCards)
- **ANLT-02**: Correct vs incorrect count (OverviewCards)
- **ANLT-03**: Overall accuracy percentage (OverviewCards)
- **ANLT-04**: Weak topics list with per-topic accuracy (WeakTopicsList)
- **ANLT-05**: Per-topic accuracy breakdown in chart (TopicAccuracyChart)
- **ANLT-06**: Progress over time trend chart (ProgressTrendChart)

---

## Tasks

### Task 1: Install Recharts
```bash
cd client && npm install recharts
```

---

### Task 2: Add Analytics Types
**File:** `client/src/types/index.ts`
**Change:** Add analytics types at the end

```typescript
// --- Analytics ---

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

### Task 3: Create Analytics API and Hooks
**File:** `client/src/api/analytics.ts`

```typescript
import api from "./client";
import type { AnalyticsDashboard, TopicStats } from "@/types";

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  const response = await api.get<{ success: boolean; data: AnalyticsDashboard }>(
    "/analytics/dashboard"
  );
  return response.data.data;
}

export async function getWeakTopics(): Promise<TopicStats[]> {
  const response = await api.get<{ success: boolean; data: TopicStats[] }>(
    "/analytics/weak-topics"
  );
  return response.data.data;
}
```

**File:** `client/src/hooks/use-analytics.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { getAnalyticsDashboard, getWeakTopics } from "@/api/analytics";

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: getAnalyticsDashboard,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useWeakTopics() {
  return useQuery({
    queryKey: ["analytics", "weak-topics"],
    queryFn: getWeakTopics,
    staleTime: 60 * 1000,
  });
}
```

---

### Task 4: Create Analytics Components
**Directory:** `client/src/components/analytics/`

#### 4a. OverviewCards.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OverviewStats } from "@/types";
import { Target, CheckCircle, XCircle, TrendingUp } from "lucide-react";

interface OverviewCardsProps {
  stats: OverviewStats;
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  const cards = [
    {
      title: "Total Attempts",
      value: stats.totalAttempts,
      icon: Target,
      color: "text-blue-500",
    },
    {
      title: "Correct",
      value: stats.correctCount,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Incorrect",
      value: stats.incorrectCount,
      icon: XCircle,
      color: "text-red-500",
    },
    {
      title: "Accuracy",
      value: `${stats.accuracyPercentage}%`,
      icon: TrendingUp,
      color: stats.accuracyPercentage >= 70 ? "text-green-500" : "text-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

#### 4b. TopicAccuracyChart.tsx
```typescript
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicStats } from "@/types";

interface TopicAccuracyChartProps {
  topics: TopicStats[];
}

export function TopicAccuracyChart({ topics }: TopicAccuracyChartProps) {
  const getBarColor = (accuracy: number) => {
    if (accuracy >= 80) return "#22c55e"; // green
    if (accuracy >= 70) return "#3b82f6"; // blue
    if (accuracy >= 50) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  // Truncate topic names for display
  const data = topics.map((t) => ({
    ...t,
    displayName: t.topic.length > 15 ? t.topic.slice(0, 15) + "..." : t.topic,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accuracy by Topic</CardTitle>
      </CardHeader>
      <CardContent>
        {topics.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No topic data yet. Complete some practice sessions to see your breakdown.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis type="category" dataKey="displayName" width={100} />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Accuracy"]}
                labelFormatter={(label) => {
                  const topic = topics.find(
                    (t) =>
                      t.topic === label ||
                      (t.topic.length > 15 && t.topic.slice(0, 15) + "..." === label)
                  );
                  return topic?.topic || label;
                }}
              />
              <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.accuracy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 4c. ProgressTrendChart.tsx
```typescript
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyProgress } from "@/types";

interface ProgressTrendChartProps {
  data: DailyProgress[];
}

export function ProgressTrendChart({ data }: ProgressTrendChartProps) {
  // Format dates for display
  const chartData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No progress data yet. Start practicing to track your improvement!
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "accuracy") return [`${value}%`, "Accuracy"];
                  return [value, name];
                }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 4d. WeakTopicsList.tsx
```typescript
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TopicStats } from "@/types";
import { AlertTriangle, TrendingUp } from "lucide-react";

interface WeakTopicsListProps {
  topics: TopicStats[];
}

export function WeakTopicsList({ topics }: WeakTopicsListProps) {
  const navigate = useNavigate();

  const handleDrill = () => {
    // Navigate to practice with weak_topic mode pre-selected
    navigate("/practice");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Weak Topics
        </CardTitle>
        {topics.length > 0 && (
          <Button onClick={handleDrill} size="sm">
            Drill Weak Topics
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {topics.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Great job! No weak topics detected.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Keep practicing to maintain your performance.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => (
              <div
                key={topic.topic}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{topic.topic}</p>
                  <p className="text-sm text-muted-foreground">
                    {topic.total} attempts
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium text-red-500">{topic.accuracy}%</p>
                    <p className="text-xs text-muted-foreground">
                      Recent: {topic.recentAccuracy}%
                    </p>
                  </div>
                  <Badge variant="destructive">Weak</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 4e. TopicStatusBadge.tsx
```typescript
import { Badge } from "@/components/ui/badge";

interface TopicStatusBadgeProps {
  isWeak: boolean;
  isMastered: boolean;
}

export function TopicStatusBadge({ isWeak, isMastered }: TopicStatusBadgeProps) {
  if (isMastered) {
    return <Badge className="bg-green-500">Mastered</Badge>;
  }
  if (isWeak) {
    return <Badge variant="destructive">Weak</Badge>;
  }
  return <Badge variant="secondary">Normal</Badge>;
}
```

---

### Task 5: Update ProgressPage with Dashboard
**File:** `client/src/pages/ProgressPage.tsx`

```typescript
import { useAnalyticsDashboard } from "@/hooks/use-analytics";
import { OverviewCards } from "@/components/analytics/OverviewCards";
import { TopicAccuracyChart } from "@/components/analytics/TopicAccuracyChart";
import { ProgressTrendChart } from "@/components/analytics/ProgressTrendChart";
import { WeakTopicsList } from "@/components/analytics/WeakTopicsList";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, BarChart3 } from "lucide-react";

export function ProgressPage() {
  const { data: dashboard, isLoading, error } = useAnalyticsDashboard();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-500">Failed to load analytics. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (!dashboard || dashboard.overview.totalAttempts === 0) {
    return (
      <div className="p-6 max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">Your Progress</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No progress data yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Start practicing to see your progress here! Upload study materials
              and complete practice sessions to track your accuracy and weak
              areas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Progress</h2>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(dashboard.lastUpdated).toLocaleString()}
        </p>
      </div>

      {/* Overview Stats */}
      <OverviewCards stats={dashboard.overview} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopicAccuracyChart topics={dashboard.topicBreakdown} />
        <ProgressTrendChart data={dashboard.dailyProgress} />
      </div>

      {/* Weak Topics */}
      <WeakTopicsList topics={dashboard.weakTopics} />
    </div>
  );
}
```

---

### Task 6: Create Analytics Components Directory
```bash
mkdir -p client/src/components/analytics
```

---

## Verification

After completing all tasks:

```bash
cd client && npm run build
```

Expected: 0 errors

---

## Files Created/Modified

| File | Action |
|------|--------|
| `client/src/types/index.ts` | MODIFY |
| `client/src/api/analytics.ts` | CREATE |
| `client/src/hooks/use-analytics.ts` | CREATE |
| `client/src/components/analytics/OverviewCards.tsx` | CREATE |
| `client/src/components/analytics/TopicAccuracyChart.tsx` | CREATE |
| `client/src/components/analytics/ProgressTrendChart.tsx` | CREATE |
| `client/src/components/analytics/WeakTopicsList.tsx` | CREATE |
| `client/src/components/analytics/TopicStatusBadge.tsx` | CREATE |
| `client/src/pages/ProgressPage.tsx` | MODIFY |

## Dependencies Added

- `recharts` - React charting library
