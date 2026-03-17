import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, FileText, Brain, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadStep = "uploading" | "extracting" | "detecting" | "complete";

interface UploadProgressProps {
  step: UploadStep;
  filename?: string;
}

const steps = [
  { key: "uploading" as const, label: "Uploading file", icon: FileText },
  { key: "extracting" as const, label: "Extracting text", icon: Brain },
  { key: "detecting" as const, label: "Detecting topics", icon: Tags },
  { key: "complete" as const, label: "Complete", icon: CheckCircle2 },
];

function getProgress(step: UploadStep): number {
  switch (step) {
    case "uploading":
      return 15;
    case "extracting":
      return 45;
    case "detecting":
      return 75;
    case "complete":
      return 100;
  }
}

function getStepIndex(step: UploadStep): number {
  return steps.findIndex((s) => s.key === step);
}

export function UploadProgress({ step, filename }: UploadProgressProps) {
  const currentIndex = getStepIndex(step);

  return (
    <div className="space-y-4">
      {filename && (
        <p className="text-sm text-muted-foreground">
          Processing: <span className="font-medium text-foreground">{filename}</span>
        </p>
      )}

      <Progress value={getProgress(step)} className="h-2" />

      <div className="space-y-2">
        {steps.map((s, idx) => {
          const isActive = idx === currentIndex;
          const isDone = idx < currentIndex;
          const Icon = s.icon;

          return (
            <div
              key={s.key}
              className={cn(
                "flex items-center gap-2 text-sm",
                isActive && "text-primary font-medium",
                isDone && "text-muted-foreground",
                !isActive && !isDone && "text-muted-foreground/50"
              )}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
