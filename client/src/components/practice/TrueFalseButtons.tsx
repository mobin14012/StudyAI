interface TrueFalseButtonsProps {
  onSelect: (answer: string) => void;
  isSubmitting: boolean;
}

export function TrueFalseButtons({ onSelect, isSubmitting }: TrueFalseButtonsProps) {
  return (
    <div className="flex gap-4">
      <button
        onClick={() => onSelect("true")}
        disabled={isSubmitting}
        className="flex-1 p-4 border-2 border-green-500 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        True
      </button>
      <button
        onClick={() => onSelect("false")}
        disabled={isSubmitting}
        className="flex-1 p-4 border-2 border-red-500 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        False
      </button>
    </div>
  );
}
