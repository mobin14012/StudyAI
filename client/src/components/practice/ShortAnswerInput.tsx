import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ShortAnswerInputProps {
  onSubmit: (answer: string) => void;
  isSubmitting: boolean;
}

export function ShortAnswerInput({ onSubmit, isSubmitting }: ShortAnswerInputProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer.trim());
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here..."
        rows={4}
        disabled={isSubmitting}
        className="resize-none"
      />
      <Button
        onClick={handleSubmit}
        disabled={!answer.trim() || isSubmitting}
        className="w-full min-h-12"
        size="lg"
      >
        {isSubmitting ? "Submitting..." : "Submit Answer"}
      </Button>
    </div>
  );
}
