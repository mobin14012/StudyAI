import { useState } from "react";

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
    <div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={4}
        disabled={isSubmitting}
      />
      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || isSubmitting}
        className="mt-4 w-full py-3 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Submitting..." : "Submit Answer"}
      </button>
    </div>
  );
}
