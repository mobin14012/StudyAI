import { Card, CardContent } from "@/components/ui/card";
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
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="capitalize">{question.difficulty}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Topic Badge */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
            {question.topic}
          </span>
        </div>

        {/* Question Text */}
        <h3 className="text-xl font-medium mb-6 text-foreground">{question.text}</h3>

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
