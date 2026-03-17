export interface User {
  id: string;
  email: string;
  name: string;
  level: "junior" | "senior";
  createdAt: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// --- Study Materials ---

export interface Topic {
  name: string;
  selected: boolean;
}

export interface Material {
  id: string;
  filename: string;
  fileType: "pdf" | "text";
  fileSize: number;
  textLength: number;
  topicCount: number;
  status: "processing" | "ready" | "error";
  errorMessage?: string;
  createdAt: string;
}

export interface MaterialDetail extends Omit<Material, "topicCount"> {
  extractedText: string;
  textPreview: string;
  topics: Topic[];
  summary?: string;
  summaryGeneratedAt?: string;
}

export interface MaterialListResponse {
  data: Material[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SummaryResponse {
  summary: string;
  generatedAt: string;
  cached: boolean;
}
