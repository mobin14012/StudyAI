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
