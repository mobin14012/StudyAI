import api from "./client";
import type { ChatMessage, TutorResponse } from "@/types";

export async function sendChatMessage(
  materialId: string,
  message: string,
  history: ChatMessage[]
): Promise<TutorResponse> {
  const response = await api.post<{ success: boolean; data: TutorResponse }>(
    "/tutor/chat",
    { materialId, message, history }
  );
  return response.data.data;
}
