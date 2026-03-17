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
