import api from "./client";
import type {
  Question,
  QuestionWithAnswer,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  QuestionListResponse,
} from "@/types";

export async function generateQuestionsApi(
  params: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  const response = await api.post("/questions/generate", params, {
    timeout: 60000, // 60s timeout for AI generation
  });
  return response.data.data;
}

export async function getQuestionsApi(params: {
  materialId?: string;
  topic?: string;
  difficulty?: string;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<QuestionListResponse> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const response = await api.get(`/questions?${queryParams.toString()}`);
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

export async function getQuestionApi(id: string): Promise<Question> {
  const response = await api.get(`/questions/${id}`);
  return response.data.data;
}

export async function getQuestionWithAnswerApi(
  id: string
): Promise<QuestionWithAnswer> {
  const response = await api.get(`/questions/${id}/full`);
  return response.data.data;
}

export async function deleteQuestionApi(id: string): Promise<void> {
  await api.delete(`/questions/${id}`);
}

export async function deleteQuestionsBatchApi(ids: string[]): Promise<void> {
  await api.delete("/questions/batch", { data: { ids } });
}
