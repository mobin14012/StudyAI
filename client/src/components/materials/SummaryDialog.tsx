import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useGenerateSummary } from "@/hooks/use-materials";
import { Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SummaryDialogProps {
  materialId: string;
  existingSummary?: string;
}

export function SummaryDialog({
  materialId,
  existingSummary,
}: SummaryDialogProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(existingSummary || "");
  const generateSummary = useGenerateSummary();

  async function handleGenerate() {
    try {
      const result = await generateSummary.mutateAsync(materialId);
      setSummary(result.summary);
      if (result.cached) {
        toast.info("Showing cached summary.");
      }
    } catch {
      toast.error("Failed to generate summary. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" className="gap-2" />}
      >
        <Sparkles className="h-4 w-4" />
        {existingSummary ? "View Summary" : "Generate Summary"}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>AI Summary</DialogTitle>
        </DialogHeader>

        {summary ? (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {summary}
            </div>
          </ScrollArea>
        ) : generateSummary.isPending ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">
              Generating summary...
            </p>
          </div>
        ) : generateSummary.isError ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">
              Failed to generate summary.
            </p>
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              Try Again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Generate an AI-powered summary of this material.
            </p>
            <Button onClick={handleGenerate}>Generate Summary</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
