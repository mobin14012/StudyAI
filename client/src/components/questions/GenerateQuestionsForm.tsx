import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionTypeSelector } from "./QuestionTypeSelector";
import { DifficultySelector } from "./DifficultySelector";
import { useMaterials, useMaterial } from "@/hooks/use-materials";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Sparkles, AlertCircle, RefreshCw, BookOpen, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { QuestionType, DifficultyLevel, GenerateQuestionsRequest } from "@/types";

interface GenerateQuestionsFormProps {
  onSubmit: (params: GenerateQuestionsRequest) => void;
  isLoading?: boolean;
}

export function GenerateQuestionsForm({
  onSubmit,
  isLoading,
}: GenerateQuestionsFormProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    data: materialsData, 
    isLoading: materialsLoading, 
    error: materialsError,
    refetch,
    isRefetching
  } = useMaterials({ status: "ready" });

  const [materialId, setMaterialId] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [types, setTypes] = useState<QuestionType[]>(["mcq"]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    user?.level === "junior" ? "easy" : "medium"
  );
  const [count, setCount] = useState(5);

  // Fetch material details when selected
  const { data: materialDetail } = useMaterial(materialId);

  // Reset topic when material changes
  useEffect(() => {
    setSelectedTopic("");
  }, [materialId]);

  // Get ready materials - filter to only those with topics
  const allReadyMaterials = materialsData?.data || [];
  const materialsWithTopics = allReadyMaterials.filter(m => m.topicCount > 0);

  // Get selected topics from material
  const availableTopics = materialDetail?.topics.filter((t) => t.selected) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId || !selectedTopic) return;

    onSubmit({
      materialId,
      topic: selectedTopic,
      difficulty,
      types,
      count,
    });
  };

  const handleRetry = () => {
    refetch();
  };

  const isValid = materialId && selectedTopic && types.length > 0;

  // Loading state
  if (materialsLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (materialsError) {
    const errorMessage = (materialsError as any)?.response?.data?.error?.message 
      || (materialsError as Error)?.message 
      || "Failed to load materials";

    return (
      <div className="text-center py-8 space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <div>
          <p className="text-destructive font-medium">Failed to load materials</p>
          <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry}
          disabled={isRefetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Retrying..." : "Retry"}
        </Button>
      </div>
    );
  }

  // Empty state - no materials with topics available
  if (materialsWithTopics.length === 0) {
    const hasAnyMaterials = allReadyMaterials.length > 0;
    
    return (
      <div className="text-center py-8 space-y-4">
        <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
        <div>
          <p className="font-medium">No materials ready for question generation</p>
          <p className="text-sm text-muted-foreground mt-1">
            {hasAnyMaterials 
              ? "Your materials don't have topics yet. Go to Materials page and click 'Retry Detection' to detect topics."
              : "Upload study materials first to generate questions."
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
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Select Material */}
      <div className="space-y-2">
        <Label>Study Material</Label>
        <Select value={materialId} onValueChange={(v) => setMaterialId(v || "")}>
          <SelectTrigger>
            <SelectValue placeholder="Select a material" />
          </SelectTrigger>
          <SelectContent>
            {materialsWithTopics.map((material) => (
              <SelectItem key={material.id} value={material.id}>
                {material.filename}
                <span className="text-muted-foreground ml-2">
                  ({material.topicCount} topics)
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Step 2: Select Topic */}
      {materialId && (
        <div className="space-y-2">
          <Label>Topic</Label>
          {availableTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableTopics.map((topic) => (
                <Badge
                  key={topic.name}
                  variant={selectedTopic === topic.name ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedTopic === topic.name
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                  onClick={() => setSelectedTopic(topic.name)}
                >
                  {topic.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No topics selected for this material.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Configure Generation */}
      {selectedTopic && (
        <>
          <QuestionTypeSelector selected={types} onChange={setTypes} />
          <DifficultySelector value={difficulty} onChange={setDifficulty} />

          <div className="space-y-2">
            <Label htmlFor="count">Number of Questions</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">1-10 questions per generation</p>
          </div>
        </>
      )}

      <Button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {isLoading ? "Generating..." : "Generate Questions"}
      </Button>
    </form>
  );
}
