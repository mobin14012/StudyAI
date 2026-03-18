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
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
          Weak Topics
        </CardTitle>
        {topics.length > 0 && (
          <Button onClick={handleDrill} size="sm" className="w-full sm:w-auto min-h-10">
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
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/50 rounded-lg gap-2"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{topic.topic}</p>
                  <p className="text-sm text-muted-foreground">
                    {topic.total} attempts
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-left sm:text-right">
                    <p className="font-medium text-red-500">{topic.accuracy}%</p>
                    <p className="text-xs text-muted-foreground">
                      Recent: {topic.recentAccuracy}%
                    </p>
                  </div>
                  <Badge variant="destructive" className="shrink-0">Weak</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
