import { useReducer, useEffect, useCallback } from "react";

interface PomodoroState {
  mode: "work" | "shortBreak" | "longBreak";
  timeLeft: number; // seconds
  isRunning: boolean;
  completedPomodoros: number;
  settings: {
    workMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakInterval: number;
  };
}

type PomodoroAction =
  | { type: "TICK" }
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESET" }
  | { type: "COMPLETE" }
  | { type: "SET_MODE"; mode: PomodoroState["mode"] }
  | { type: "UPDATE_SETTINGS"; settings: Partial<PomodoroState["settings"]> };

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
};

function getInitialState(): PomodoroState {
  const savedSettings = localStorage.getItem("pomodoroSettings");
  const settings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
  return {
    mode: "work",
    timeLeft: settings.workMinutes * 60,
    isRunning: false,
    completedPomodoros: 0,
    settings,
  };
}

function pomodoroReducer(state: PomodoroState, action: PomodoroAction): PomodoroState {
  switch (action.type) {
    case "TICK":
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };
    case "START":
      return { ...state, isRunning: true };
    case "PAUSE":
      return { ...state, isRunning: false };
    case "RESET": {
      const resetTime = state.mode === "work"
        ? state.settings.workMinutes
        : state.mode === "shortBreak"
        ? state.settings.shortBreakMinutes
        : state.settings.longBreakMinutes;
      return { ...state, timeLeft: resetTime * 60, isRunning: false };
    }
    case "COMPLETE": {
      const newCompleted = state.mode === "work" ? state.completedPomodoros + 1 : state.completedPomodoros;
      const nextMode = state.mode === "work"
        ? newCompleted % state.settings.longBreakInterval === 0
          ? "longBreak"
          : "shortBreak"
        : "work";
      const nextTime = nextMode === "work"
        ? state.settings.workMinutes
        : nextMode === "shortBreak"
        ? state.settings.shortBreakMinutes
        : state.settings.longBreakMinutes;
      return { ...state, mode: nextMode, timeLeft: nextTime * 60, isRunning: false, completedPomodoros: newCompleted };
    }
    case "SET_MODE": {
      const time = action.mode === "work"
        ? state.settings.workMinutes
        : action.mode === "shortBreak"
        ? state.settings.shortBreakMinutes
        : state.settings.longBreakMinutes;
      return { ...state, mode: action.mode, timeLeft: time * 60, isRunning: false };
    }
    case "UPDATE_SETTINGS": {
      const newSettings = { ...state.settings, ...action.settings };
      localStorage.setItem("pomodoroSettings", JSON.stringify(newSettings));
      return { ...state, settings: newSettings };
    }
    default:
      return state;
  }
}

export function usePomodoro() {
  const [state, dispatch] = useReducer(pomodoroReducer, null, getInitialState);

  useEffect(() => {
    if (!state.isRunning) return;

    const interval = setInterval(() => {
      if (state.timeLeft <= 1) {
        dispatch({ type: "COMPLETE" });
        // Optional: play notification sound
        try {
          const audio = new Audio("/notification.mp3");
          audio.play().catch(() => {});
        } catch {
          // Ignore audio errors
        }
      } else {
        dispatch({ type: "TICK" });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isRunning, state.timeLeft]);

  return {
    ...state,
    start: useCallback(() => dispatch({ type: "START" }), []),
    pause: useCallback(() => dispatch({ type: "PAUSE" }), []),
    reset: useCallback(() => dispatch({ type: "RESET" }), []),
    setMode: useCallback((mode: PomodoroState["mode"]) => dispatch({ type: "SET_MODE", mode }), []),
    updateSettings: useCallback((settings: Partial<PomodoroState["settings"]>) => 
      dispatch({ type: "UPDATE_SETTINGS", settings }), []),
  };
}
