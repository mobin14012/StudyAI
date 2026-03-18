import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";

export function PomodoroTimer() {
  const { mode, timeLeft, isRunning, completedPomodoros, start, pause, reset, setMode } = usePomodoro();

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const modeColors = {
    work: "text-red-500",
    shortBreak: "text-green-500",
    longBreak: "text-blue-500",
  };

  const modeLabels = {
    work: "Focus Time",
    shortBreak: "Short Break",
    longBreak: "Long Break",
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-center flex items-center justify-center gap-2">
          {mode === "work" ? <Brain className="h-5 w-5" /> : <Coffee className="h-5 w-5" />}
          {modeLabels[mode]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`text-6xl font-mono text-center ${modeColors[mode]}`}>
          {timeDisplay}
        </div>
        
        <div className="flex justify-center gap-2">
          {isRunning ? (
            <Button onClick={pause} variant="outline" size="lg">
              <Pause className="h-5 w-5" />
            </Button>
          ) : (
            <Button onClick={start} size="lg">
              <Play className="h-5 w-5" />
            </Button>
          )}
          <Button onClick={reset} variant="outline" size="lg">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex justify-center gap-2">
          <Button
            variant={mode === "work" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("work")}
          >
            Work
          </Button>
          <Button
            variant={mode === "shortBreak" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("shortBreak")}
          >
            Short
          </Button>
          <Button
            variant={mode === "longBreak" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("longBreak")}
          >
            Long
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Pomodoros completed: {completedPomodoros}
        </p>
      </CardContent>
    </Card>
  );
}
