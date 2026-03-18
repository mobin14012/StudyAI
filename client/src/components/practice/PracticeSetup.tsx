import { useState } from "react";
import { useMaterials } from "@/hooks/use-materials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Start Practice Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Practice Mode</Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant={mode === "general" ? "default" : "outline"}
              className="flex-1 min-h-11"
              onClick={() => setMode("general")}
            >
              General Practice
            </Button>
            <Button
              type="button"
              variant={mode === "weak_topic" ? "default" : "outline"}
              className="flex-1 min-h-11"
              onClick={() => setMode("weak_topic")}
            >
              Weak Topics Drill
            </Button>
          </div>
        </div>

        {/* Material Selection (for general mode) */}
        {mode === "general" && (
          <div className="space-y-2">
            <Label htmlFor="material">Select Material</Label>
            <Select
              value={materialId}
              onValueChange={setMaterialId}
              disabled={materialsLoading}
            >
              <SelectTrigger id="material" className="w-full min-h-11">
                <SelectValue placeholder="Select a material..." />
              </SelectTrigger>
              <SelectContent>
                {materials?.data.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    <span className="truncate">{material.filename}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Question Count */}
        <div className="space-y-3">
          <Label htmlFor="questionCount">Number of Questions: {questionCount}</Label>
          <input
            id="questionCount"
            type="range"
            min={5}
            max={20}
            step={1}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5</span>
            <span>20</span>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={!canStart || isLoading}
          className="w-full min-h-12"
          size="lg"
        >
          {isLoading ? "Starting..." : "Start Practice"}
        </Button>
      </CardContent>
    </Card>
  );
}
