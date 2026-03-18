import { useQuery } from "@tanstack/react-query";
import { getAnalyticsDashboard, getWeakTopics, getTopicStats } from "@/api/analytics";

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: getAnalyticsDashboard,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useWeakTopics() {
  return useQuery({
    queryKey: ["analytics", "weak-topics"],
    queryFn: getWeakTopics,
    staleTime: 60 * 1000,
  });
}

export function useTopicStats(topic: string) {
  return useQuery({
    queryKey: ["analytics", "topic", topic],
    queryFn: () => getTopicStats(topic),
    enabled: !!topic,
    staleTime: 60 * 1000,
  });
}
