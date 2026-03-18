import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SessionResultsProps {
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
  onRestart: () => void;
}

export function SessionResults({ score, onRestart }: SessionResultsProps) {
  const getGrade = () => {
    if (score.percentage >= 90)
      return { text: "Excellent!", color: "text-green-500" };
    if (score.percentage >= 70)
      return { text: "Good job!", color: "text-blue-500" };
    if (score.percentage >= 50)
      return { text: "Keep practicing!", color: "text-yellow-500" };
    return { text: "Needs improvement", color: "text-red-500" };
  };

  const grade = getGrade();

  const getStrokeColor = () => {
    if (score.percentage >= 70) return "#22c55e";
    if (score.percentage >= 50) return "#eab308";
    return "#ef4444";
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="pt-6 text-center">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Practice Complete!</h2>
        <p className={`text-xl font-medium mb-6 ${grade.color}`}>{grade.text}</p>

        {/* Score Circle */}
        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              className="stroke-muted"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={getStrokeColor()}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(score.percentage / 100) * 440} 440`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{score.percentage}%</span>
          </div>
        </div>

        {/* Score Details */}
        <p className="text-muted-foreground mb-6">
          You got <span className="font-bold text-foreground">{score.correct}</span> out of{" "}
          <span className="font-bold text-foreground">{score.total}</span> questions correct.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={onRestart} className="w-full" size="lg">
            Start New Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
