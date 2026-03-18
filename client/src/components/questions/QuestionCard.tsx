import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question, QuestionWithAnswer } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple Choice",
  short_answer: "Short Answer",
  true_false: "True/False",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

interface QuestionCardProps {
  question: Question | QuestionWithAnswer;
  onDelete?: (id: string) => void;
  showAnswer?: boolean;
}

function isQuestionWithAnswer(
  q: Question | QuestionWithAnswer
): q is QuestionWithAnswer {
  return "correctAnswer" in q;
}

export function QuestionCard({
  question,
  onDelete,
  showAnswer = false,
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(showAnswer);
  const hasAnswer = isQuestionWithAnswer(question);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{TYPE_LABELS[question.type]}</Badge>
            <Badge className={cn("capitalize", DIFFICULTY_COLORS[question.difficulty])}>
              {question.difficulty}
            </Badge>
            <Badge variant="secondary">{question.topic}</Badge>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(question.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-medium">{question.text}</p>

        {question.type === "mcq" && question.options && (
          <div className="space-y-2 ml-4">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md border",
                  expanded &&
                    hasAnswer &&
                    option === question.correctAnswer &&
                    "border-green-500 bg-green-50"
                )}
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="text-sm">{option}</span>
              </div>
            ))}
          </div>
        )}

        {hasAnswer && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Answer
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show Answer
                </>
              )}
            </Button>

            {expanded && (
              <div className="border-t pt-3 space-y-2">
                <div>
                  <span className="text-sm font-medium text-green-700">
                    Correct Answer:{" "}
                  </span>
                  <span className="text-sm">{question.correctAnswer}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Explanation:{" "}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {question.explanation}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
