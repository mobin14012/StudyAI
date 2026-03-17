import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, File, Calendar, Hash } from "lucide-react";
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
