import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBookmarks, addBookmark, removeBookmark, checkBookmark } from "@/api/bookmarks";

export function useBookmarks() {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: getBookmarks,
  });
}

export function useBookmarkStatus(questionId: string) {
  return useQuery({
    queryKey: ["bookmark", questionId],
    queryFn: () => checkBookmark(questionId),
    enabled: !!questionId,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, isBookmarked }: { questionId: string; isBookmarked: boolean }) => {
      if (isBookmarked) {
        await removeBookmark(questionId);
      } else {
        await addBookmark(questionId);
      }
    },
    onSuccess: (_, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: ["bookmark", questionId] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
