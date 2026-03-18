import { create } from "zustand";
import type { PracticeQuestion, AttemptResult } from "@/types";

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

export const usePracticeStore = create<PracticeState>((set) => ({
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
