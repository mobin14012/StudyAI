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
                formatter={(value) => [`${value}%`, "Accuracy"]}
                labelFormatter={(label) => {
                  const topic = topics.find(
                    (t) =>
                      t.topic === label ||
                      (t.topic.length > 15 && t.topic.slice(0, 15) + "..." === label)
                  );
                  return topic?.topic || String(label);
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
