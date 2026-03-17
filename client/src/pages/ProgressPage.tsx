import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function ProgressPage() {
  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Your Progress</h2>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No progress data yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Start practicing to see your progress here! Upload study materials and complete practice sessions to track your accuracy and weak areas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
