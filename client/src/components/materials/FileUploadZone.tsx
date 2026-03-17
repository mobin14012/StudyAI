import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
};

export function FileUploadZone({
  onFileSelect,
  disabled = false,
}: FileUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections,
  } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled,
  });

  const rejection = fileRejections[0];
  let errorMessage = "";
  if (rejection) {
    const error = rejection.errors[0];
    if (error?.code === "file-too-large") {
      errorMessage = "File too large. Maximum size is 10MB.";
    } else if (error?.code === "file-invalid-type") {
      errorMessage = "Invalid file type. Only PDF files are accepted.";
    } else {
      errorMessage = error?.message || "File rejected.";
    }
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {isDragActive ? (
            <>
              <FileText className="h-10 w-10 text-primary" />
              <p className="text-sm font-medium">Drop your PDF here</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Drag and drop a PDF here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF files only, up to 10MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
