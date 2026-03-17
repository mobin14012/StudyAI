import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { textUploadSchema, type TextUploadInput } from "@/schemas/material.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface TextUploadFormProps {
  onSubmit: (data: TextUploadInput) => void;
  isLoading?: boolean;
}

export function TextUploadForm({
  onSubmit,
  isLoading = false,
}: TextUploadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TextUploadInput>({
    resolver: zodResolver(textUploadSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text-title">Title</Label>
        <Input
          id="text-title"
          placeholder="e.g., Biology Chapter 5 Notes"
          {...register("title")}
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="text-content">Study Material</Label>
        <Textarea
          id="text-content"
          placeholder="Paste your study material here..."
          className="min-h-[200px] resize-y"
          {...register("content")}
          disabled={isLoading}
        />
        {errors.content && (
          <p className="text-sm text-destructive">
            {errors.content.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            <span className="ml-2">Analyzing...</span>
          </>
        ) : (
          "Analyze Topics"
        )}
      </Button>
    </form>
  );
}
