import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUploadZone } from "@/components/materials/FileUploadZone";
import { TextUploadForm } from "@/components/materials/TextUploadForm";
import { UploadProgress } from "@/components/materials/UploadProgress";
import { TopicReview } from "@/components/materials/TopicReview";
import {
  useUploadMaterial,
  useUploadText,
  useUpdateTopics,
} from "@/hooks/use-materials";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";
import type { MaterialDetail, Topic } from "@/types";
import type { TextUploadInput } from "@/schemas/material.schemas";

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; filename: string }
  | { phase: "review"; material: MaterialDetail }
  | { phase: "error"; message: string };

export function UploadPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const uploadMaterial = useUploadMaterial();
  const uploadText = useUploadText();
  const updateTopics = useUpdateTopics();

  async function handleFileSelect(file: File) {
    setState({ phase: "uploading", filename: file.name });
    try {
      const material = await uploadMaterial.mutateAsync(file);
      setState({ phase: "review", material });
      toast.success("File uploaded and topics detected!");
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ||
        "Upload failed. Please try again.";
      setState({ phase: "error", message });
      toast.error(message);
    }
  }

  async function handleTextSubmit(data: TextUploadInput) {
    setState({ phase: "uploading", filename: `${data.title}.txt` });
    try {
      const material = await uploadText.mutateAsync({
        text: data.content,
        title: data.title,
      });
      setState({ phase: "review", material });
      toast.success("Text analyzed and topics detected!");
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ||
        "Analysis failed. Please try again.";
      setState({ phase: "error", message });
      toast.error(message);
    }
  }

  async function handleSaveTopics(topics: Topic[]) {
    if (state.phase !== "review") return;
    try {
      await updateTopics.mutateAsync({
        id: state.material.id,
        topics,
      });
      toast.success("Topic selections saved!");
    } catch {
      toast.error("Failed to save topic selections.");
    }
  }

  function handleReset() {
    setState({ phase: "idle" });
  }

  // Uploading / Processing state
  if (state.phase === "uploading") {
    return (
      <div className="p-4 md:p-6 max-w-2xl">
        <h2 className="text-xl md:text-2xl font-bold mb-6">Upload Materials</h2>
        <Card>
          <CardContent className="pt-6">
            <UploadProgress
              step={uploadMaterial.isPending || uploadText.isPending ? "detecting" : "uploading"}
              filename={state.filename}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Topic review state
  if (state.phase === "review") {
    return (
      <div className="p-4 md:p-6 max-w-2xl">
        <h2 className="text-xl md:text-2xl font-bold mb-6">Upload Materials</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg break-all">
              Review Topics — {state.material.filename}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopicReview
              topics={state.material.topics}
              onSave={handleSaveTopics}
              isSaving={updateTopics.isPending}
            />
            <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="min-h-11 flex-1"
                onClick={() =>
                  navigate(`/materials/${state.material.id}`)
                }
              >
                View Material
              </Button>
              <Button variant="outline" className="min-h-11 flex-1" onClick={handleReset}>
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (state.phase === "error") {
    return (
      <div className="p-4 md:p-6 max-w-2xl">
        <h2 className="text-xl md:text-2xl font-bold mb-6">Upload Materials</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-destructive">{state.message}</p>
              <Button onClick={handleReset} className="min-h-11">Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Idle state — show upload form
  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Upload Materials</h2>
      <Tabs defaultValue="pdf">
        <TabsList className="mb-4 w-full grid grid-cols-2">
          <TabsTrigger value="pdf" className="gap-2 min-h-10">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span> PDF
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-2 min-h-10">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Paste</span> Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdf">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Upload PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploadZone onFileSelect={handleFileSelect} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Paste Study Material</CardTitle>
            </CardHeader>
            <CardContent>
              <TextUploadForm onSubmit={handleTextSubmit} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
