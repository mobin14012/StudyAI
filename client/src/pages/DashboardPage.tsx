import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Upload, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome back, {user?.name || "Student"}</h2>
        <p className="text-muted-foreground">Ready to study? Upload materials to get started.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/upload">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-3">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Upload Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Upload PDFs or text to generate questions.</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/practice">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Start a study session with AI-generated questions.</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/progress">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Track your accuracy and weak areas.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
