import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { loginApi, registerApi, logoutApi, refreshApi } from "@/api/auth";
import type { AuthResponse } from "@/types";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, setLoading, logout: clearAuth } =
    useAuthStore();
  
  // Track if refresh has been attempted (per component instance)
  const hasAttemptedRef = useRef(false);

  // Silent refresh on initial app load only
  useEffect(() => {
    // Skip if already attempted in this component
    if (hasAttemptedRef.current) {
      return;
    }
    
    // Skip if already authenticated
    if (isAuthenticated) {
      if (isLoading) {
        setLoading(false);
      }
      return;
    }

    // Mark as attempted
    hasAttemptedRef.current = true;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

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
