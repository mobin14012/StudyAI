import api from "./client";
import type { Note, CreateNoteInput, UpdateNoteInput } from "@/types";

export async function getNotes(search?: string): Promise<Note[]> {
  const params = search ? { q: search } : {};
  const response = await api.get<{ success: boolean; data: Note[] }>("/notes", { params });
  return response.data.data;
}

export async function getNote(id: string): Promise<Note> {
  const response = await api.get<{ success: boolean; data: Note }>(`/notes/${id}`);
  return response.data.data;
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const response = await api.post<{ success: boolean; data: Note }>("/notes", input);
  return response.data.data;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  const response = await api.patch<{ success: boolean; data: Note }>(`/notes/${id}`, input);
  return response.data.data;
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/notes/${id}`);
}
