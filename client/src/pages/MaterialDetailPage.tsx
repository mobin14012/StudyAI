import { useParams, useNavigate } from "react-router-dom";
import { useMaterial, useDeleteMaterial } from "@/hooks/use-materials";
import { MaterialDetail } from "@/components/materials/MaterialDetail";
import { SummaryDialog } from "@/components/materials/SummaryDialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: material, isLoading, error } = useMaterial(id || "");
  const deleteMaterial = useDeleteMaterial();

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this material?")) {
      return;
    }
    try {
      await deleteMaterial.mutateAsync(id);
      toast.success("Material deleted.");
      navigate("/materials");
    } catch {
      toast.error("Failed to delete material.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-destructive">
          Material not found or failed to load.
        </p>
        <Button
          variant="outline"
          className="mt-4 min-h-11"
          onClick={() => navigate("/materials")}
        >
          Back to Materials
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          variant="ghost"
          className="gap-2 min-h-11 justify-start sm:justify-center"
          onClick={() => navigate("/materials")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Materials
        </Button>
        <div className="flex gap-2">
          {material.status === "ready" && (
            <SummaryDialog
              materialId={material.id}
              existingSummary={material.summary}
            />
          )}
          <Button
            variant="destructive"
            size="sm"
            className="gap-2 min-h-10 flex-1 sm:flex-none"
            onClick={handleDelete}
            disabled={deleteMaterial.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <MaterialDetail material={material} />
    </div>
  );
}
