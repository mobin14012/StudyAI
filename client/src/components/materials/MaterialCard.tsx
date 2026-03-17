import { Link } from "react-router-dom";
import { FileText, File, Clock, Tags, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Material } from "@/types";

interface MaterialCardProps {
  material: Material;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: Material["status"] }) {
  switch (status) {
    case "ready":
      return <Badge variant="default">Ready</Badge>;
    case "processing":
      return <Badge variant="secondary">Processing</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
  }
}

export function MaterialCard({ material }: MaterialCardProps) {
  const FileIcon = material.fileType === "pdf" ? File : FileText;

  return (
    <Link to={`/materials/${material.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <FileIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {material.filename}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFileSize(material.fileSize)} &middot;{" "}
              {material.fileType.toUpperCase()}
            </p>
          </div>
          <StatusBadge status={material.status} />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Tags className="h-3 w-3" />
              {material.topicCount} topics
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(material.createdAt)}
            </span>
          </div>
          {material.status === "error" && material.errorMessage && (
            <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span className="truncate">{material.errorMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
