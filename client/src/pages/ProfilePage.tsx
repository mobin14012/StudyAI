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
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { toast } from "sonner";
import { Target, Flame, Trophy } from "lucide-react";

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name || "");
  const [level, setLevel] = useState<"junior" | "senior">(user?.level || "junior");
  const [dailyGoal, setDailyGoal] = useState<number>(user?.dailyGoal || 10);

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
    const updates: Record<string, string | number> = {};
    if (name !== user?.name) updates.name = name;
    if (level !== user?.level) updates.level = level;
    if (dailyGoal !== user?.dailyGoal) updates.dailyGoal = dailyGoal;
    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
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

        {/* Goals & Streaks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goals & Streaks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="daily-goal">Daily Question Goal</Label>
              <Input
                id="daily-goal"
                type="number"
                min={1}
                max={100}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value) || 10)}
              />
              <p className="text-xs text-muted-foreground">
                How many questions you want to practice each day.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Flame className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{user?.currentStreak || 0}</p>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{user?.longestStreak || 0}</p>
                  <p className="text-xs text-muted-foreground">Longest Streak</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pomodoro Timer */}
      <div className="flex justify-center">
        <PomodoroTimer />
      </div>
    </div>
  );
}
