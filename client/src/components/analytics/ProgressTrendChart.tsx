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
  // Format dates for display (shorter format on mobile)
  const chartData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg">Progress Over Time</CardTitle>
      </CardHeader>
      <CardContent className="px-2 md:px-6">
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No progress data yet. Start practicing to track your improvement!
          </p>
        ) : (
          <div className="h-[200px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData}
                margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[0, 100]} 
                  unit="%" 
                  tick={{ fontSize: 12 }}
                  width={40}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "accuracy") return [`${value}%`, "Accuracy"];
                    return [value, String(name)];
                  }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
