import api from "./client";
import type { AnalyticsDashboard, TopicStats } from "@/types";

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  const response = await api.get<{ success: boolean; data: AnalyticsDashboard }>(
    "/analytics/dashboard"
  );
  return response.data.data;
}

export async function getWeakTopics(): Promise<TopicStats[]> {
  const response = await api.get<{ success: boolean; data: TopicStats[] }>(
    "/analytics/weak-topics"
  );
  return response.data.data;
}

export async function getTopicStats(topic: string): Promise<TopicStats> {
  const response = await api.get<{ success: boolean; data: TopicStats }>(
    `/analytics/topic/${encodeURIComponent(topic)}`
  );
  return response.data.data;
}
