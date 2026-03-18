import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionList } from "@/components/questions/QuestionList";
import { useQuestions, useDeleteQuestion } from "@/hooks/use-questions";
import { useMaterials } from "@/hooks/use-materials";
import { Sparkles, Filter, X } from "lucide-react";

export function QuestionsPage() {
  const [page, setPage] = useState(1);
  const [materialId, setMaterialId] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [type, setType] = useState<string>("");

  const { data: materialsData } = useMaterials();
  const { data: questionsData, isLoading } = useQuestions({
    materialId: materialId || undefined,
    difficulty: difficulty || undefined,
    type: type || undefined,
    page,
  });

  const deleteMutation = useDeleteQuestion();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Question deleted");
    } catch {
      toast.error("Failed to delete question");
    }
  };

  const clearFilters = () => {
    setMaterialId("");
    setDifficulty("");
    setType("");
    setPage(1);
  };

  const hasFilters = materialId || difficulty || type;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Questions</h2>
          <p className="text-muted-foreground">
            Browse and manage your generated questions.
          </p>
        </div>
        <Link to="/questions/generate">
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate New
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <Select value={materialId} onValueChange={(v) => setMaterialId(v || "")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All materials" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All materials</SelectItem>
            {materialsData?.data
              .filter((m) => m.status === "ready")
              .map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.filename}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={difficulty} onValueChange={(v) => setDifficulty(v || "")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v) => setType(v || "")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Question type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="mcq">Multiple Choice</SelectItem>
            <SelectItem value="short_answer">Short Answer</SelectItem>
            <SelectItem value="true_false">True/False</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Question List */}
      <QuestionList
        questions={questionsData?.data || []}
        onDelete={handleDelete}
        isLoading={isLoading}
        pagination={
          questionsData?.pagination
            ? {
                page: questionsData.pagination.page,
                totalPages: questionsData.pagination.totalPages,
                total: questionsData.pagination.total,
              }
            : undefined
        }
        onPageChange={setPage}
      />
    </div>
  );
}
