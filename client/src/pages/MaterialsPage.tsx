import { useState } from "react";
import { Link } from "react-router-dom";
import { useMaterials } from "@/hooks/use-materials";
import { MaterialList } from "@/components/materials/MaterialList";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function MaterialsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMaterials(page);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Materials</h2>
          <p className="text-muted-foreground">
            Your uploaded study materials and detected topics.
          </p>
        </div>
        <Link to="/upload">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload New
          </Button>
        </Link>
      </div>

      <MaterialList
        materials={data?.data || []}
        pagination={{
          page: data?.pagination.page || 1,
          totalPages: data?.pagination.totalPages || 1,
          total: data?.pagination.total || 0,
        }}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}
