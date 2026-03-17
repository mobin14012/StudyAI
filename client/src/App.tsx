import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProgressPage } from "@/pages/ProgressPage";
import { UploadPage } from "@/pages/UploadPage";
import { MaterialsPage } from "@/pages/MaterialsPage";
import { MaterialDetailPage } from "@/pages/MaterialDetailPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Placeholder pages for Phase 3+ features
function PracticePlaceholder() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Practice</h2>
      <p className="text-muted-foreground">Upload study materials to start practicing.</p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/practice" element={<PracticePlaceholder />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/materials/:id" element={<MaterialDetailPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
