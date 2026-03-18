import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  generateQuestionsApi,
  getQuestionsApi,
  getQuestionApi,
  getQuestionWithAnswerApi,
  deleteQuestionApi,
  deleteQuestionsBatchApi,
} from "@/api/questions";
import type { GenerateQuestionsRequest } from "@/types";

export function useQuestions(params: {
  materialId?: string;
  topic?: string;
  difficulty?: string;
  type?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ["questions", params],
    queryFn: () => getQuestionsApi(params),
  });
}

export function useQuestion(id: string) {
  return useQuery({
    queryKey: ["questions", id],
    queryFn: () => getQuestionApi(id),
    enabled: !!id,
  });
}

export function useQuestionWithAnswer(id: string) {
  return useQuery({
    queryKey: ["questions", id, "full"],
    queryFn: () => getQuestionWithAnswerApi(id),
    enabled: !!id,
  });
}

export function useGenerateQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: GenerateQuestionsRequest) =>
      generateQuestionsApi(params),
    onSuccess: (_data, variables) => {
      // Invalidate questions list for this material
      queryClient.invalidateQueries({
        queryKey: ["questions", { materialId: variables.materialId }],
      });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useDeleteQuestionsBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestionsBatchApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}
