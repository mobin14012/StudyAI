interface McqOptionsProps {
  options: string[];
  onSelect: (answer: string) => void;
  isSubmitting: boolean;
}

export function McqOptions({ options, onSelect, isSubmitting }: McqOptionsProps) {
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onSelect(option)}
          disabled={isSubmitting}
          className="w-full p-4 text-left border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="font-medium mr-3">
            {String.fromCharCode(65 + index)}.
          </span>
          {option}
        </button>
      ))}
    </div>
  );
}
