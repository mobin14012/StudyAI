import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AlertCircle, RefreshCw, Upload, BookOpen } from "lucide-react";
import type { StartPracticeRequest } from "@/types";

interface PracticeSetupProps {
  onStart: (request: StartPracticeRequest) => void;
  isLoading: boolean;
}

export function PracticeSetup({ onStart, isLoading }: PracticeSetupProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"general" | "weak_topic">("general");
  const [materialId, setMaterialId] = useState("");
  const [questionCount, setQuestionCount] = useState(10);

  const { 
    data: materials, 
    isLoading: materialsLoading, 
    error: materialsError,
    refetch,
    isRefetching
  } = useMaterials({
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

  const handleRetry = () => {
    refetch();
  };

  // Filter materials that have topics (needed for question generation)
  const materialsWithTopics = materials?.data?.filter(m => m.topicCount > 0) || [];
  
  const canStart =
    mode === "weak_topic" || (mode === "general" && materialId);

  // Show loading state while materials are loading
  if (materialsLoading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 flex justify-center">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  // Show error state if materials failed to load
  if (materialsError) {
    const errorMessage = (materialsError as any)?.response?.data?.error?.message 
      || (materialsError as Error)?.message 
      || "Failed to load materials";
    
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <p className="text-destructive font-medium">Failed to load materials</p>
            <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
          </div>
          <Button 
            onClick={handleRetry} 
            variant="outline"
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            {isRefetching ? "Retrying..." : "Retry"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no materials with topics
  if (materialsWithTopics.length === 0) {
    const hasAnyMaterials = (materials?.data?.length || 0) > 0;
    
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center space-y-4">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium">No materials ready for practice</p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasAnyMaterials 
                ? "Your materials don't have topics yet. Go to Materials page and click 'Retry Detection' to detect topics."
                : "Upload study materials and generate questions first to start practicing."
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {hasAnyMaterials ? (
              <Button onClick={() => navigate("/materials")} className="gap-2">
                <BookOpen className="h-4 w-4" />
                Go to Materials
              </Button>
            ) : (
              <Button onClick={() => navigate("/materials")} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Materials
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

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
              onValueChange={(v) => setMaterialId(v || "")}
            >
              <SelectTrigger id="material" className="w-full min-h-11">
                <SelectValue placeholder="Select a material..." />
              </SelectTrigger>
              <SelectContent>
                {materialsWithTopics.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    <span className="truncate">{material.filename}</span>
                    <span className="text-muted-foreground ml-2">
                      ({material.topicCount} topics)
                    </span>
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
