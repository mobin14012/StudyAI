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
