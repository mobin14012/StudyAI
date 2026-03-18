import { useState } from "react";
import { useMaterials } from "@/hooks/use-materials";
import type { StartPracticeRequest } from "@/types";

interface PracticeSetupProps {
  onStart: (request: StartPracticeRequest) => void;
  isLoading: boolean;
}

export function PracticeSetup({ onStart, isLoading }: PracticeSetupProps) {
  const [mode, setMode] = useState<"general" | "weak_topic">("general");
  const [materialId, setMaterialId] = useState("");
  const [questionCount, setQuestionCount] = useState(10);

  const { data: materials, isLoading: materialsLoading } = useMaterials({
    status: "ready",
    page: 1,
    limit: 100,
  });

  const handleStart = () => {
    onStart({
      mode,
      materialId: mode === "general" ? materialId : undefined,
      questionCount,
    });
  };

  const canStart =
    mode === "weak_topic" || (mode === "general" && materialId);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Start Practice Session</h2>

      {/* Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Practice Mode
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="mode"
              value="general"
              checked={mode === "general"}
              onChange={() => setMode("general")}
              className="mr-2"
            />
            General Practice
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="mode"
              value="weak_topic"
              checked={mode === "weak_topic"}
              onChange={() => setMode("weak_topic")}
              className="mr-2"
            />
            Weak Topics Drill
          </label>
        </div>
      </div>

      {/* Material Selection (for general mode) */}
      {mode === "general" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Material
          </label>
          <select
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={materialsLoading}
          >
            <option value="">Select a material...</option>
            {materials?.data.map((material) => (
              <option key={material.id} value={material.id}>
                {material.filename}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Question Count */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Questions: {questionCount}
        </label>
        <input
          type="range"
          min="5"
          max="20"
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!canStart || isLoading}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? "Starting..." : "Start Practice"}
      </button>
    </div>
  );
}
