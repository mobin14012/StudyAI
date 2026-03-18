import api from "./client";
import type { Bookmark } from "@/types";

export async function getBookmarks(): Promise<Bookmark[]> {
  const response = await api.get<{ success: boolean; data: Bookmark[] }>("/bookmarks");
  return response.data.data;
}

export async function addBookmark(questionId: string): Promise<void> {
  await api.post("/bookmarks", { questionId });
}

export async function removeBookmark(questionId: string): Promise<void> {
  await api.delete(`/bookmarks/${questionId}`);
}

export async function checkBookmark(questionId: string): Promise<boolean> {
  const response = await api.get<{ success: boolean; data: { isBookmarked: boolean } }>(
    `/bookmarks/check/${questionId}`
  );
  return response.data.data.isBookmarked;
}
