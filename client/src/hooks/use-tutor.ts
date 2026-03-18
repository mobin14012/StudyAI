import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { sendChatMessage } from "@/api/tutor";
import type { ChatMessage } from "@/types";

export function useTutor(materialId: string) {
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const mutation = useMutation({
    mutationFn: (message: string) => sendChatMessage(materialId, message, history),
    onSuccess: (data) => {
      setHistory(data.history);
    },
  });

  const clearHistory = () => setHistory([]);

  return {
    history,
    sendMessage: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    clearHistory,
  };
}
