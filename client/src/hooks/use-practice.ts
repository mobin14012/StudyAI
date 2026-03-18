import { useMutation, useQuery } from "@tanstack/react-query";
import {
  startPracticeSession,
  submitAnswer,
  getSessionResults,
} from "@/api/practice";
import type { StartPracticeRequest, SubmitAnswerRequest } from "@/types";

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
