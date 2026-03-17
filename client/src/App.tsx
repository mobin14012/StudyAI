import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Placeholder pages — will be replaced in Plan 04
function DashboardPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p className="text-muted-foreground">Welcome to StudyAI. Upload materials to get started.</p>
    </div>
  );
}

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <p className="text-muted-foreground text-center">Login form will be implemented in Plan 04</p>
      </div>
    </div>
  );
}

function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Create Account</h1>
        <p className="text-muted-foreground text-center">Register form will be implemented in Plan 04</p>
      </div>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
      <p className="text-muted-foreground">Profile settings will be implemented in Plan 04</p>
    </div>
  );
}

function ProgressPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
      <p className="text-muted-foreground">Start practicing to see your progress here!</p>
    </div>
  );
}

function PracticePlaceholder() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Practice</h2>
      <p className="text-muted-foreground">Upload study materials to start practicing.</p>
    </div>
  );
}

function UploadPlaceholder() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Upload Materials</h2>
      <p className="text-muted-foreground">Upload feature coming in Phase 2.</p>
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

          {/* App layout routes (will be protected in Plan 04) */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/practice" element={<PracticePlaceholder />} />
            <Route path="/upload" element={<UploadPlaceholder />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/profile" element={<ProfilePage />} />
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
