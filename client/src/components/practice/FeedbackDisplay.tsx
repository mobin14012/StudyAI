import { Check, X, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AttemptResult } from "@/types";

interface FeedbackDisplayProps {
  result: AttemptResult;
  onNext: () => void;
  isLastQuestion: boolean;
}

export function FeedbackDisplay({
  result,
  onNext,
  isLastQuestion,
}: FeedbackDisplayProps) {
  const isCorrect = result.isCorrect;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Result Card */}
      <Card
        className={`border-2 ${
          isCorrect
            ? "border-green-500/50 bg-green-500/10"
            : "border-red-500/50 bg-red-500/10"
        }`}
      >
        <CardContent className="pt-6">
          {/* Result Header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full ${
                isCorrect ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              {isCorrect ? (
                <Check className="h-6 w-6 text-green-500" />
              ) : (
                <X className="h-6 w-6 text-red-500" />
              )}
            </div>
            <h3
              className={`text-2xl font-bold ${
                isCorrect ? "text-green-500" : "text-red-500"
              }`}
            >
              {isCorrect ? "Correct!" : "Incorrect"}
            </h3>
          </div>

          {/* User's Answer */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground font-medium mb-1">
              Your answer:
            </p>
            <p className="text-foreground">{result.userAnswer}</p>
          </div>

          {/* Correct Answer (if wrong) */}
          {!isCorrect && (
            <div className="mb-4 p-3 bg-background rounded-md border">
              <p className="text-sm text-muted-foreground font-medium mb-1">
                Correct answer:
              </p>
              <p className="text-foreground font-medium">{result.correctAnswer}</p>
            </div>
          )}

          {/* AI Evaluation (for short answers) */}
          {result.aiEvaluation && (
            <div className="mb-4 p-3 bg-background rounded-md border">
              <p className="text-sm text-muted-foreground font-medium mb-1">
                AI Score: {result.aiEvaluation.score}/100
              </p>
              <p className="text-foreground mt-1">{result.aiEvaluation.feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explanation Card - Prominent */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary mb-2">Explanation</p>
              <p className="text-foreground leading-relaxed">{result.explanation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Button */}
      <Button onClick={onNext} className="w-full" size="lg">
        {isLastQuestion ? "View Results" : "Next Question"}
      </Button>
    </div>
  );
}
