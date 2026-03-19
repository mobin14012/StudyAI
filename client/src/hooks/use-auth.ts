import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { loginApi, registerApi, logoutApi, refreshApi } from "@/api/auth";
import type { AuthResponse } from "@/types";

// Track if we've already attempted refresh this session
let hasAttemptedRefresh = false;

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, setLoading, logout: clearAuth } =
    useAuthStore();

  // Silent refresh on initial app load only
  useEffect(() => {
    // Skip if already authenticated or already attempted refresh
    if (isAuthenticated || hasAttemptedRefresh) {
      if (isLoading) {
        setLoading(false);
      }
      return;
    }

    hasAttemptedRefresh = true;
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
  }, [isAuthenticated, isLoading, setAuth, setLoading, clearAuth]);

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
