import { useBookmarks } from "@/hooks/use-bookmarks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bookmark } from "lucide-react";

export function BookmarksPage() {
  const { data: bookmarks, isLoading, error } = useBookmarks();

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center text-red-500">
            Failed to load bookmarks. Please try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Bookmark className="h-6 w-6" />
        Bookmarked Questions
      </h2>

      {!bookmarks || bookmarks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
            <p className="text-muted-foreground">
              Bookmark questions during practice to review them later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge>{b.question.type.replace("_", " ")}</Badge>
                    <Badge variant="outline">{b.question.difficulty}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {b.question.topic}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p>{b.question.text}</p>
                {b.question.options && (
                  <ul className="mt-2 ml-4 list-disc text-sm text-muted-foreground">
                    {b.question.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
