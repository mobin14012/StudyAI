import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMaterialsApi,
  getMaterialApi,
  uploadMaterialApi,
  uploadTextApi,
  updateTopicsApi,
  generateSummaryApi,
  deleteMaterialApi,
} from "@/api/materials";
import type { Topic } from "@/types";

export interface UseMaterialsOptions {
  page?: number;
  limit?: number;
  status?: "processing" | "ready" | "error";
}

export function useMaterials(options: UseMaterialsOptions = {}) {
  const { page = 1, limit = 20, status } = options;
  return useQuery({
    queryKey: ["materials", page, limit, status],
    queryFn: () => getMaterialsApi(page, limit, status),
  });
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: ["materials", id],
    queryFn: () => getMaterialApi(id),
    enabled: !!id,
  });
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadMaterialApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useUploadText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ text, title }: { text: string; title: string }) =>
      uploadTextApi(text, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useUpdateTopics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, topics }: { id: string; topics: Topic[] }) =>
      updateTopicsApi(id, topics),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["materials", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useGenerateSummary() {
  return useMutation({
    mutationFn: generateSummaryApi,
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMaterialApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}
