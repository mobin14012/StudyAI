import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { DifficultyLevel } from "@/types";

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: "easy", label: "Easy", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "hard", label: "Hard", color: "bg-red-100 text-red-800 border-red-300" },
];

interface DifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (level: DifficultyLevel) => void;
}

export function DifficultySelector({
  value,
  onChange,
}: DifficultySelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Difficulty Level</Label>
      <div className="flex gap-2">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-2 rounded-md border text-sm font-medium transition-colors",
              value === option.value
                ? option.color
                : "bg-muted text-muted-foreground border-border hover:bg-accent"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
