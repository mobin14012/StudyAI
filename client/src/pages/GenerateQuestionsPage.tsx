import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenerateQuestionsForm } from "@/components/questions/GenerateQuestionsForm";
import { GenerationProgress } from "@/components/questions/GenerationProgress";
import { QuestionList } from "@/components/questions/QuestionList";
import { useGenerateQuestions } from "@/hooks/use-questions";
import { List, Sparkles } from "lucide-react";
import type { Question, GenerateQuestionsRequest, GenerateQuestionsResponse } from "@/types";

export function GenerateQuestionsPage() {
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [lastResult, setLastResult] = useState<GenerateQuestionsResponse | null>(null);
  const generateMutation = useGenerateQuestions();

  const handleGenerate = async (params: GenerateQuestionsRequest) => {
    try {
      const result = await generateMutation.mutateAsync(params);
      setGeneratedQuestions(result.questions);
      setLastResult(result);
      toast.success(
        `Generated ${result.generated} new question${result.generated !== 1 ? "s" : ""}` +
          (result.cached > 0 ? ` (${result.cached} from cache)` : "")
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Failed to generate questions";
      toast.error(message);
    }
  };

  const handleReset = () => {
    setGeneratedQuestions([]);
    setLastResult(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Generate Questions</h2>
          <p className="text-muted-foreground">
            Create study questions from your uploaded materials.
          </p>
        </div>
        <Link to="/questions">
          <Button variant="outline" className="gap-2">
            <List className="h-4 w-4" />
            View All Questions
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[350px_1fr]">
        {/* Left: Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <GenerateQuestionsForm
                onSubmit={handleGenerate}
                isLoading={generateMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Results */}
        <div>
          {generateMutation.isPending ? (
            <Card>
              <CardContent className="pt-6">
                <GenerationProgress isLoading={true} />
              </CardContent>
            </Card>
          ) : generatedQuestions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  {lastResult && (
                    <span>
                      {lastResult.totalReturned} questions ({lastResult.generated} new,{" "}
                      {lastResult.cached} cached)
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Generate New
                </Button>
              </div>
              <QuestionList questions={generatedQuestions} showAnswers={true} />
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Ready to Generate</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a material and topic, then click Generate Questions
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
