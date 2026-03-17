import api from "./client";
import axios from "axios";
import type { AuthResponse, User } from "@/types";

export async function loginApi(data: { email: string; password: string }): Promise<AuthResponse> {
  const response = await api.post("/auth/login", data);
  return response.data.data;
}

export async function registerApi(data: {
  email: string;
  password: string;
  name: string;
  level: "junior" | "senior";
}): Promise<AuthResponse> {
  const response = await api.post("/auth/register", data);
  return response.data.data;
}

export async function refreshApi(): Promise<AuthResponse> {
  const response = await axios.post("/api/auth/refresh", {}, { withCredentials: true });
  return response.data.data;
}

export async function logoutApi(): Promise<void> {
  await api.post("/auth/logout");
}

export async function getProfileApi(): Promise<User> {
  const response = await api.get("/users/me");
  return response.data.data;
}

export async function updateProfileApi(data: {
  name?: string;
  level?: "junior" | "senior";
}): Promise<User> {
  const response = await api.patch("/users/me", data);
  return response.data.data;
}
