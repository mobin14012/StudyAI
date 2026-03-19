import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProgressPage } from "@/pages/ProgressPage";
import { UploadPage } from "@/pages/UploadPage";
import { MaterialsPage } from "@/pages/MaterialsPage";
import { MaterialDetailPage } from "@/pages/MaterialDetailPage";
import { GenerateQuestionsPage } from "@/pages/GenerateQuestionsPage";
import { QuestionsPage } from "@/pages/QuestionsPage";
import { PracticePage } from "@/pages/PracticePage";
import { TutorPage } from "@/pages/TutorPage";
import { BookmarksPage } from "@/pages/BookmarksPage";
import { NotesPage } from "@/pages/NotesPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected app routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/practice" element={<PracticePage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/materials/:id" element={<MaterialDetailPage />} />
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/questions/generate" element={<GenerateQuestionsPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/tutor" element={<TutorPage />} />
                <Route path="/bookmarks" element={<BookmarksPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
