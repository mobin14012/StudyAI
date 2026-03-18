import { useEffect } from "react";
import { toast } from "sonner";
import {
  usePracticeStore,
  selectCurrentQuestion,
  selectIsComplete,
  selectScore,
} from "@/stores/practice-store";
import { useStartPractice, useSubmitAnswer } from "@/hooks/use-practice";
import { PracticeSetup } from "@/components/practice/PracticeSetup";
import { QuestionDisplay } from "@/components/practice/QuestionDisplay";
import { FeedbackDisplay } from "@/components/practice/FeedbackDisplay";
import { SessionResults } from "@/components/practice/SessionResults";
import type { StartPracticeRequest, AttemptResult } from "@/types";

export function PracticePage() {
  const {
    sessionId,
    questions,
    currentIndex,
    showFeedback,
    lastResult,
    isSubmitting,
    startSession,
    submitAttempt,
    setSubmitting,
    showFeedbackFor,
    nextQuestion,
    reset,
  } = usePracticeStore();

  const currentQuestion = usePracticeStore(selectCurrentQuestion);
  const isComplete = usePracticeStore(selectIsComplete);
  const score = usePracticeStore(selectScore);

  const startPracticeMutation = useStartPractice();
  const submitAnswerMutation = useSubmitAnswer();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const handleStart = async (request: StartPracticeRequest) => {
    try {
      const result = await startPracticeMutation.mutateAsync(request);
      startSession(result.sessionId, result.mode, result.questions);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to start practice session");
    }
  };

  const handleSubmit = async (answer: string) => {
    if (!sessionId || !currentQuestion) return;

    setSubmitting(true);
    try {
      const result = await submitAnswerMutation.mutateAsync({
        sessionId,
        questionId: currentQuestion.id,
        answer,
      });

      const attemptResult: AttemptResult = {
        questionId: currentQuestion.id,
        userAnswer: answer,
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
        aiEvaluation: result.aiEvaluation
          ? { score: result.aiEvaluation.score, feedback: result.aiEvaluation.feedback }
          : undefined,
      };

      submitAttempt(attemptResult);
      showFeedbackFor(attemptResult);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    nextQuestion();
  };

  const handleRestart = () => {
    reset();
  };

  // No session: show setup
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">Practice Mode</h1>
          <PracticeSetup
            onStart={handleStart}
            isLoading={startPracticeMutation.isPending}
          />
        </div>
      </div>
    );
  }

  // Session complete: show results
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <SessionResults score={score} onRestart={handleRestart} />
        </div>
      </div>
    );
  }

  // Showing feedback after answer
  if (showFeedback && lastResult) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <FeedbackDisplay
            result={lastResult}
            onNext={handleNext}
            isLastQuestion={currentIndex + 1 >= questions.length}
          />
        </div>
      </div>
    );
  }

  // Active question
  if (currentQuestion) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <QuestionDisplay
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    );
  }

  return null;
}
