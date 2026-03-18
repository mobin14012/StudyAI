import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { QuestionType } from "@/types";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "short_answer", label: "Short Answer" },
  { value: "true_false", label: "True / False" },
];

interface QuestionTypeSelectorProps {
  selected: QuestionType[];
  onChange: (types: QuestionType[]) => void;
}

export function QuestionTypeSelector({
  selected,
  onChange,
}: QuestionTypeSelectorProps) {
  const handleToggle = (type: QuestionType) => {
    if (selected.includes(type)) {
      // Don't allow deselecting if it's the last one
      if (selected.length > 1) {
        onChange(selected.filter((t) => t !== type));
      }
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Question Types</Label>
      <div className="flex flex-wrap gap-4">
        {QUESTION_TYPES.map((type) => (
          <div key={type.value} className="flex items-center space-x-2">
            <Checkbox
              id={`type-${type.value}`}
              checked={selected.includes(type.value)}
              onCheckedChange={() => handleToggle(type.value)}
            />
            <Label
              htmlFor={`type-${type.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {type.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
