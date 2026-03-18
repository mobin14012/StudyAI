import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface TrueFalseButtonsProps {
  onSelect: (answer: string) => void;
  isSubmitting: boolean;
}

export function TrueFalseButtons({ onSelect, isSubmitting }: TrueFalseButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        variant="outline"
        onClick={() => onSelect("true")}
        disabled={isSubmitting}
        className="flex-1 min-h-12 gap-2 border-2 border-green-500/50 text-green-600 hover:bg-green-500/10 hover:border-green-500 dark:text-green-400"
      >
        <Check className="h-5 w-5" />
        True
      </Button>
      <Button
        variant="outline"
        onClick={() => onSelect("false")}
        disabled={isSubmitting}
        className="flex-1 min-h-12 gap-2 border-2 border-red-500/50 text-red-600 hover:bg-red-500/10 hover:border-red-500 dark:text-red-400"
      >
        <X className="h-5 w-5" />
        False
      </Button>
    </div>
  );
}
