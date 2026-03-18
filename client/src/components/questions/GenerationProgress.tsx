import { Loader2 } from "lucide-react";

interface GenerationProgressProps {
  isLoading: boolean;
  cached?: number;
}

export function GenerationProgress({
  isLoading,
  cached,
}: GenerationProgressProps) {
  if (!isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-lg font-medium">Generating questions...</p>
        <p className="text-sm text-muted-foreground">
          This may take a few seconds
        </p>
        {cached !== undefined && cached > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {cached} question{cached !== 1 ? "s" : ""} from cache
          </p>
        )}
      </div>
    </div>
  );
}
