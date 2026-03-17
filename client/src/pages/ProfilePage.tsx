import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { updateProfileApi } from "@/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LevelSelect } from "@/components/profile/LevelSelect";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name || "");
  const [level, setLevel] = useState<"junior" | "senior">(user?.level || "junior");

  const updateMutation = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  function handleSave() {
    const updates: Record<string, string> = {};
    if (name !== user?.name) updates.name = name;
    if (level !== user?.level) updates.level = level;
    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Level</Label>
            <LevelSelect value={level} onValueChange={setLevel} />
            <p className="text-xs text-muted-foreground">
              Your level affects the default difficulty of generated questions.
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <LoadingSpinner size="sm" /> : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
