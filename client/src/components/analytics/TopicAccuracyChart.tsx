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

  // Truncate topic names for display (shorter on mobile)
  const data = topics.map((t) => ({
    ...t,
    displayName: t.topic.length > 12 ? t.topic.slice(0, 12) + "..." : t.topic,
  }));

  // Calculate dynamic height based on number of topics
  const chartHeight = Math.max(200, Math.min(400, topics.length * 40 + 60));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg">Accuracy by Topic</CardTitle>
      </CardHeader>
      <CardContent className="px-2 md:px-6">
        {topics.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No topic data yet. Complete some practice sessions to see your breakdown.
          </p>
        ) : (
          <div style={{ height: chartHeight, minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data} 
                layout="vertical" 
                margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  unit="%" 
                  tick={{ fontSize: 12 }}
                  tickCount={5}
                />
                <YAxis 
                  type="category" 
                  dataKey="displayName" 
                  width={80}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Accuracy"]}
                  labelFormatter={(label) => {
                    const topic = topics.find(
                      (t) =>
                        t.topic === label ||
                        (t.topic.length > 12 && t.topic.slice(0, 12) + "..." === label)
                    );
                    return topic?.topic || String(label);
                  }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.accuracy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
