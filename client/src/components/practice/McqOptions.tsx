import { Button } from "@/components/ui/button";

interface McqOptionsProps {
  options: string[];
  onSelect: (answer: string) => void;
  isSubmitting: boolean;
}

export function McqOptions({ options, onSelect, isSubmitting }: McqOptionsProps) {
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => onSelect(option)}
          disabled={isSubmitting}
          className="w-full min-h-12 p-4 text-left justify-start h-auto whitespace-normal"
        >
          <span className="font-medium mr-3 shrink-0">
            {String.fromCharCode(65 + index)}.
          </span>
          <span className="text-left">{option}</span>
        </Button>
      ))}
    </div>
  );
}
