import api from "./client";
import type {
  PracticeSession,
  StartPracticeRequest,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SessionResults,
} from "@/types";

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
