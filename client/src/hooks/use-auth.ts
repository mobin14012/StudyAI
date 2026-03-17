import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { loginApi, registerApi, logoutApi, refreshApi } from "@/api/auth";
import type { AuthResponse } from "@/types";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, logout: clearAuth } =
    useAuthStore();

  // Silent refresh on mount
  useEffect(() => {
    let cancelled = false;
    async function tryRefresh() {
      try {
        const data = await refreshApi();
        if (!cancelled) {
          setAuth(data.accessToken, data.user);
        }
      } catch {
        if (!cancelled) {
          clearAuth();
        }
      }
    }
    tryRefresh();
    return () => {
      cancelled = true;
    };
  }, [setAuth, clearAuth]);

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data: AuthResponse) => {
      setAuth(data.accessToken, data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (data: AuthResponse) => {
      setAuth(data.accessToken, data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      clearAuth();
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
