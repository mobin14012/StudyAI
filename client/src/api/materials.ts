import api from "./client";
import type { MaterialDetail, MaterialListResponse, SummaryResponse, Topic } from "@/types";

export async function uploadMaterialApi(file: File): Promise<MaterialDetail> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/materials/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000, // 60s timeout for upload + AI processing
  });
  return response.data.data;
}

export async function uploadTextApi(
  text: string,
  title: string
): Promise<MaterialDetail> {
  const blob = new Blob([text], { type: "text/plain" });
  const file = new File([blob], `${title}.txt`, { type: "text/plain" });
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/materials/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return response.data.data;
}

export async function getMaterialsApi(
  page = 1,
  limit = 20,
  status?: "processing" | "ready" | "error"
): Promise<MaterialListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) {
    params.append("status", status);
  }
  const response = await api.get(`/materials?${params.toString()}`);
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

export async function getMaterialApi(id: string): Promise<MaterialDetail> {
  const response = await api.get(`/materials/${id}`);
  return response.data.data;
}

export async function updateTopicsApi(
  id: string,
  topics: Topic[]
): Promise<MaterialDetail> {
  const response = await api.patch(`/materials/${id}/topics`, { topics });
  return response.data.data;
}

export async function generateSummaryApi(
  id: string
): Promise<SummaryResponse> {
  const response = await api.post(`/materials/${id}/summary`);
  return response.data.data;
}

export async function deleteMaterialApi(id: string): Promise<void> {
  await api.delete(`/materials/${id}`);
}
