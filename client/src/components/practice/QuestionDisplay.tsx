import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { PracticeQuestion } from "@/types";
import { McqOptions } from "./McqOptions";
import { TrueFalseButtons } from "./TrueFalseButtons";
import { ShortAnswerInput } from "./ShortAnswerInput";

interface QuestionDisplayProps {
  question: PracticeQuestion;
  currentIndex: number;
  totalQuestions: number;
  onSubmit: (answer: string) => void;
  isSubmitting: boolean;
}

export function QuestionDisplay({
  question,
  currentIndex,
  totalQuestions,
  onSubmit,
  isSubmitting,
}: QuestionDisplayProps) {
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-4 md:p-6 space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <Badge variant="outline" className="capitalize">
              {question.difficulty}
            </Badge>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Topic Badge */}
        <div>
          <Badge variant="secondary">{question.topic}</Badge>
        </div>

        {/* Question Text */}
        <h3 className="text-lg md:text-xl font-medium leading-relaxed text-foreground">
          {question.text}
        </h3>

        {/* Answer Input based on question type */}
        {question.type === "mcq" && question.options && (
          <McqOptions
            options={question.options}
            onSelect={onSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {question.type === "true_false" && (
          <TrueFalseButtons onSelect={onSubmit} isSubmitting={isSubmitting} />
        )}

        {question.type === "short_answer" && (
          <ShortAnswerInput onSubmit={onSubmit} isSubmitting={isSubmitting} />
        )}
      </CardContent>
    </Card>
  );
}
