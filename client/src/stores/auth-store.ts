import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (accessToken: string, user: User) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // true until initial refresh check completes
  setAuth: (accessToken: string, user: User) =>
    set({ accessToken, user, isAuthenticated: true, isLoading: false }),
  setUser: (user: User) => set({ user }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  logout: () =>
    set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false }),
}));
