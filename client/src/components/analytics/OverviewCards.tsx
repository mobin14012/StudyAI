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
