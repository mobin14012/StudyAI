import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, File, Calendar, Hash, RefreshCw, AlertCircle } from "lucide-react";
import { useRetryTopicDetection } from "@/hooks/use-materials";
import { toast } from "sonner";
import type { MaterialDetail as MaterialDetailType } from "@/types";

interface MaterialDetailProps {
  material: MaterialDetailType;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MaterialDetail({ material }: MaterialDetailProps) {
  const FileIcon = material.fileType === "pdf" ? File : FileText;
  const retryTopics = useRetryTopicDetection();
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetryTopics() {
    setIsRetrying(true);
    try {
      await retryTopics.mutateAsync(material.id);
      toast.success("Topics detected successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to detect topics. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  }

  const hasNoTopics = material.topics.length === 0;
  const hasErrorMessage = material.errorMessage;

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-start gap-3">
        <FileIcon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate">
            {material.filename}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{material.fileType.toUpperCase()}</span>
            <span>{formatFileSize(material.fileSize)}</span>
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {material.textLength.toLocaleString()} chars
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(material.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Warning if no topics */}
      {hasNoTopics && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    No topics detected
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasErrorMessage || "Topic detection failed. You can retry or use this material without topics."}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 min-h-10 shrink-0"
                onClick={handleRetryTopics}
                disabled={isRetrying}
              >
                <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
                {isRetrying ? "Detecting..." : "Retry Detection"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topics */}
      {material.topics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Topics ({material.topics.filter((t) => t.selected).length}{" "}
              selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {material.topics.map((topic) => (
                <Badge
                  key={topic.name}
                  variant={topic.selected ? "default" : "secondary"}
                >
                  {topic.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Extracted Text</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans">
              {material.extractedText}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
