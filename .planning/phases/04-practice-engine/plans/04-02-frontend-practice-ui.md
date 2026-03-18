---
plan: 04-02
title: Frontend Practice UI
phase: 04-practice-engine
requirements: [PRAC-01, PRAC-02, PRAC-03, PRAC-06, PRAC-07]
depends-on: Plan 04-01 (Backend)
estimated-tasks: 7
---

# Plan 04-02: Frontend Practice UI

## Goal
Implement the complete practice UI: Zustand store for session state, API hooks, all practice components, and integrate into the app routing.

## Requirements Addressed
- **PRAC-01**: Start practice session from materials (PracticeSetup)
- **PRAC-02**: Questions displayed one at a time (QuestionDisplay)
- **PRAC-03**: User can submit answer for each question (answer inputs)
- **PRAC-06**: Immediate feedback with correct/incorrect + explanation (FeedbackDisplay)
- **PRAC-07**: General and weak-topic modes (PracticeSetup)

---

## Tasks

### Task 1: Add Practice Types
**File:** `client/src/types/index.ts`
**Change:** Add practice-related types

```typescript
// Add to existing types file

export interface PracticeQuestion {
  id: string;
  type: "mcq" | "short_answer" | "true_false";
  difficulty: "easy" | "medium" | "hard";
  text: string;
  options?: string[];
  topic: string;
}

export interface PracticeSession {
  sessionId: string;
  mode: "general" | "weak_topic";
  questions: PracticeQuestion[];
  totalQuestions: number;
}

export interface StartPracticeRequest {
  mode: "general" | "weak_topic";
  materialId?: string;
  questionCount?: number;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
  timeSpentMs?: number;
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
    isCorrect: boolean;
  };
  attemptId: string;
}

export interface AttemptResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
  };
}

export interface SessionResults {
  sessionId: string;
  attempts: AttemptResult[];
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
}
```

---

### Task 2: Create Practice API Functions
**File:** `client/src/api/practice.ts`

```typescript
import { api } from "./client";
import type {
  PracticeSession,
  StartPracticeRequest,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SessionResults,
} from "../types";

export async function startPracticeSession(
  data: StartPracticeRequest
): Promise<PracticeSession> {
  const response = await api.post<{ success: boolean; data: PracticeSession }>(
    "/practice/start",
    data
  );
  return response.data.data;
}

export async function submitAnswer(
  data: SubmitAnswerRequest
): Promise<SubmitAnswerResponse> {
  const response = await api.post<{ success: boolean; data: SubmitAnswerResponse }>(
    "/practice/submit",
    data
  );
  return response.data.data;
}

export async function getSessionResults(
  sessionId: string
): Promise<SessionResults> {
  const response = await api.get<{ success: boolean; data: SessionResults }>(
    `/practice/session/${sessionId}`
  );
  return response.data.data;
}
```

---

### Task 3: Create Practice Hooks
**File:** `client/src/hooks/use-practice.ts`

```typescript
import { useMutation, useQuery } from "@tanstack/react-query";
import { startPracticeSession, submitAnswer, getSessionResults } from "../api/practice";
import type { StartPracticeRequest, SubmitAnswerRequest } from "../types";

export function useStartPractice() {
  return useMutation({
    mutationFn: (data: StartPracticeRequest) => startPracticeSession(data),
  });
}

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: (data: SubmitAnswerRequest) => submitAnswer(data),
  });
}

export function useSessionResults(sessionId: string | null) {
  return useQuery({
    queryKey: ["practice-session", sessionId],
    queryFn: () => getSessionResults(sessionId!),
    enabled: !!sessionId,
  });
}
```

---

### Task 4: Create Practice Store
**File:** `client/src/stores/practice-store.ts`

```typescript
import { create } from "zustand";
import type { PracticeQuestion, AttemptResult } from "../types";

interface PracticeState {
  // Session state
  sessionId: string | null;
  mode: "general" | "weak_topic" | null;
  questions: PracticeQuestion[];
  currentIndex: number;
  attempts: AttemptResult[];
  isSubmitting: boolean;
  showFeedback: boolean;
  lastResult: AttemptResult | null;

  // Actions
  startSession: (
    sessionId: string,
    mode: "general" | "weak_topic",
    questions: PracticeQuestion[]
  ) => void;
  submitAttempt: (result: AttemptResult) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  showFeedbackFor: (result: AttemptResult) => void;
  nextQuestion: () => void;
  endSession: () => void;
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  // Initial state
  sessionId: null,
  mode: null,
  questions: [],
  currentIndex: 0,
  attempts: [],
  isSubmitting: false,
  showFeedback: false,
  lastResult: null,

  startSession: (sessionId, mode, questions) => {
    set({
      sessionId,
      mode,
      questions,
      currentIndex: 0,
      attempts: [],
      isSubmitting: false,
      showFeedback: false,
      lastResult: null,
    });
  },

  submitAttempt: (result) => {
    set((state) => ({
      attempts: [...state.attempts, result],
    }));
  },

  setSubmitting: (isSubmitting) => {
    set({ isSubmitting });
  },

  showFeedbackFor: (result) => {
    set({
      showFeedback: true,
      lastResult: result,
    });
  },

  nextQuestion: () => {
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      showFeedback: false,
      lastResult: null,
    }));
  },

  endSession: () => {
    set({
      showFeedback: false,
      lastResult: null,
    });
  },

  reset: () => {
    set({
      sessionId: null,
      mode: null,
      questions: [],
      currentIndex: 0,
      attempts: [],
      isSubmitting: false,
      showFeedback: false,
      lastResult: null,
    });
  },
}));

// Selectors
export const selectCurrentQuestion = (state: PracticeState) =>
  state.questions[state.currentIndex] ?? null;

export const selectIsComplete = (state: PracticeState) =>
  state.currentIndex >= state.questions.length && state.questions.length > 0;

export const selectScore = (state: PracticeState) => {
  const correct = state.attempts.filter((a) => a.isCorrect).length;
  const total = state.attempts.length;
  return {
    correct,
    total,
    percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
};
```

---

### Task 5: Create Practice Components
**Directory:** `client/src/components/practice/`

#### 5a. PracticeSetup.tsx
```typescript
import { useState } from "react";
import { useMaterials } from "../../hooks/use-materials";
import type { StartPracticeRequest } from "../../types";

interface PracticeSetupProps {
  onStart: (request: StartPracticeRequest) => void;
  isLoading: boolean;
}

export function PracticeSetup({ onStart, isLoading }: PracticeSetupProps) {
  const [mode, setMode] = useState<"general" | "weak_topic">("general");
  const [materialId, setMaterialId] = useState("");
  const [questionCount, setQuestionCount] = useState(10);

  const { data: materials, isLoading: materialsLoading } = useMaterials({
    status: "ready",
    page: 1,
    limit: 100,
  });

  const handleStart = () => {
    onStart({
      mode,
      materialId: mode === "general" ? materialId : undefined,
      questionCount,
    });
  };

  const canStart =
    mode === "weak_topic" || (mode === "general" && materialId);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Start Practice Session</h2>

      {/* Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Practice Mode
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="mode"
              value="general"
              checked={mode === "general"}
              onChange={() => setMode("general")}
              className="mr-2"
            />
            General Practice
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="mode"
              value="weak_topic"
              checked={mode === "weak_topic"}
              onChange={() => setMode("weak_topic")}
              className="mr-2"
            />
            Weak Topics Drill
          </label>
        </div>
      </div>

      {/* Material Selection (for general mode) */}
      {mode === "general" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Material
          </label>
          <select
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={materialsLoading}
          >
            <option value="">Select a material...</option>
            {materials?.data.map((material) => (
              <option key={material.id} value={material.id}>
                {material.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Question Count */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Questions: {questionCount}
        </label>
        <input
          type="range"
          min="5"
          max="20"
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!canStart || isLoading}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? "Starting..." : "Start Practice"}
      </button>
    </div>
  );
}
```

#### 5b. QuestionDisplay.tsx
```typescript
import type { PracticeQuestion } from "../../types";
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span className="capitalize">{question.difficulty}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Topic Badge */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
          {question.topic}
        </span>
      </div>

      {/* Question Text */}
      <h3 className="text-xl font-medium mb-6">{question.text}</h3>

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
    </div>
  );
}
```

#### 5c. McqOptions.tsx
```typescript
interface McqOptionsProps {
  options: string[];
  onSelect: (answer: string) => void;
  isSubmitting: boolean;
}

export function McqOptions({ options, onSelect, isSubmitting }: McqOptionsProps) {
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onSelect(option)}
          disabled={isSubmitting}
          className="w-full p-4 text-left border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="font-medium mr-3">
            {String.fromCharCode(65 + index)}.
          </span>
          {option}
        </button>
      ))}
    </div>
  );
}
```

#### 5d. TrueFalseButtons.tsx
```typescript
interface TrueFalseButtonsProps {
  onSelect: (answer: string) => void;
  isSubmitting: boolean;
}

export function TrueFalseButtons({ onSelect, isSubmitting }: TrueFalseButtonsProps) {
  return (
    <div className="flex gap-4">
      <button
        onClick={() => onSelect("true")}
        disabled={isSubmitting}
        className="flex-1 p-4 border-2 border-green-500 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        True
      </button>
      <button
        onClick={() => onSelect("false")}
        disabled={isSubmitting}
        className="flex-1 p-4 border-2 border-red-500 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        False
      </button>
    </div>
  );
}
```

#### 5e. ShortAnswerInput.tsx
```typescript
import { useState } from "react";

interface ShortAnswerInputProps {
  onSubmit: (answer: string) => void;
  isSubmitting: boolean;
}

export function ShortAnswerInput({ onSubmit, isSubmitting }: ShortAnswerInputProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer.trim());
    }
  };

  return (
    <div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={4}
        disabled={isSubmitting}
      />
      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || isSubmitting}
        className="mt-4 w-full py-3 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Submitting..." : "Submit Answer"}
      </button>
    </div>
  );
}
```

#### 5f. FeedbackDisplay.tsx
```typescript
import type { AttemptResult } from "../../types";

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
  const bgColor = result.isCorrect ? "bg-green-50" : "bg-red-50";
  const borderColor = result.isCorrect ? "border-green-500" : "border-red-500";
  const iconColor = result.isCorrect ? "text-green-600" : "text-red-600";

  return (
    <div className={`max-w-2xl mx-auto p-6 ${bgColor} border-2 ${borderColor} rounded-lg`}>
      {/* Result Header */}
      <div className="flex items-center mb-4">
        <span className={`text-3xl mr-3 ${iconColor}`}>
          {result.isCorrect ? "✓" : "✗"}
        </span>
        <h3 className={`text-xl font-bold ${iconColor}`}>
          {result.isCorrect ? "Correct!" : "Incorrect"}
        </h3>
      </div>

      {/* User's Answer */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 font-medium">Your answer:</p>
        <p className="text-gray-800">{result.userAnswer}</p>
      </div>

      {/* Correct Answer (if wrong) */}
      {!result.isCorrect && (
        <div className="mb-4 p-3 bg-white rounded-md">
          <p className="text-sm text-gray-600 font-medium">Correct answer:</p>
          <p className="text-gray-800 font-medium">{result.correctAnswer}</p>
        </div>
      )}

      {/* AI Evaluation (for short answers) */}
      {result.aiEvaluation && (
        <div className="mb-4 p-3 bg-white rounded-md">
          <p className="text-sm text-gray-600 font-medium">
            AI Score: {result.aiEvaluation.score}/100
          </p>
          <p className="text-gray-700 mt-1">{result.aiEvaluation.feedback}</p>
        </div>
      )}

      {/* Explanation */}
      <div className="mb-6 p-3 bg-white rounded-md">
        <p className="text-sm text-gray-600 font-medium">Explanation:</p>
        <p className="text-gray-700 mt-1">{result.explanation}</p>
      </div>

      {/* Next Button */}
      <button
        onClick={onNext}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
      >
        {isLastQuestion ? "View Results" : "Next Question"}
      </button>
    </div>
  );
}
```

#### 5g. SessionResults.tsx
```typescript
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
    if (score.percentage >= 90) return { text: "Excellent!", color: "text-green-600" };
    if (score.percentage >= 70) return { text: "Good job!", color: "text-blue-600" };
    if (score.percentage >= 50) return { text: "Keep practicing!", color: "text-yellow-600" };
    return { text: "Needs improvement", color: "text-red-600" };
  };

  const grade = getGrade();

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
      <h2 className="text-2xl font-bold mb-2">Practice Complete!</h2>
      <p className={`text-xl font-medium mb-6 ${grade.color}`}>{grade.text}</p>

      {/* Score Circle */}
      <div className="relative w-40 h-40 mx-auto mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke={score.percentage >= 70 ? "#22c55e" : score.percentage >= 50 ? "#eab308" : "#ef4444"}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(score.percentage / 100) * 440} 440`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold">{score.percentage}%</span>
        </div>
      </div>

      {/* Score Details */}
      <p className="text-gray-600 mb-6">
        You got <span className="font-bold">{score.correct}</span> out of{" "}
        <span className="font-bold">{score.total}</span> questions correct.
      </p>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onRestart}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}
```

---

### Task 6: Create Practice Page
**File:** `client/src/pages/PracticePage.tsx`

```typescript
import { useEffect } from "react";
import { toast } from "sonner";
import {
  usePracticeStore,
  selectCurrentQuestion,
  selectIsComplete,
  selectScore,
} from "../stores/practice-store";
import { useStartPractice, useSubmitAnswer } from "../hooks/use-practice";
import { PracticeSetup } from "../components/practice/PracticeSetup";
import { QuestionDisplay } from "../components/practice/QuestionDisplay";
import { FeedbackDisplay } from "../components/practice/FeedbackDisplay";
import { SessionResults } from "../components/practice/SessionResults";
import type { StartPracticeRequest, AttemptResult } from "../types";

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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start practice session");
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit answer");
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
      <div className="min-h-screen bg-gray-50 py-12">
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <SessionResults score={score} onRestart={handleRestart} />
        </div>
      </div>
    );
  }

  // Showing feedback after answer
  if (showFeedback && lastResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
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
      <div className="min-h-screen bg-gray-50 py-12">
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
```

---

### Task 7: Update App Routes
**File:** `client/src/App.tsx`
**Change:** Replace PracticePlaceholder with PracticePage

```typescript
// Replace import
import { PracticePage } from "./pages/PracticePage";

// Replace the practice route element
<Route path="practice" element={<PracticePage />} />
```

---

## Verification

After completing all tasks:

1. **Type check:**
   ```bash
   cd client && npx tsc --noEmit
   ```

2. **Build check:**
   ```bash
   cd client && npm run build
   ```

Expected: 0 errors

---

## Files Created/Modified

| File | Action |
|------|--------|
| `client/src/types/index.ts` | MODIFY |
| `client/src/api/practice.ts` | CREATE |
| `client/src/hooks/use-practice.ts` | CREATE |
| `client/src/stores/practice-store.ts` | CREATE |
| `client/src/components/practice/PracticeSetup.tsx` | CREATE |
| `client/src/components/practice/QuestionDisplay.tsx` | CREATE |
| `client/src/components/practice/McqOptions.tsx` | CREATE |
| `client/src/components/practice/TrueFalseButtons.tsx` | CREATE |
| `client/src/components/practice/ShortAnswerInput.tsx` | CREATE |
| `client/src/components/practice/FeedbackDisplay.tsx` | CREATE |
| `client/src/components/practice/SessionResults.tsx` | CREATE |
| `client/src/pages/PracticePage.tsx` | CREATE |
| `client/src/App.tsx` | MODIFY |
