import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/auth/LoginForm";
import type { LoginFormData } from "@/schemas/auth.schemas";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginError, isLoggingIn } = useAuth();

  async function handleLogin(data: LoginFormData) {
    await login(data);
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginForm onSubmit={handleLogin} isLoading={isLoggingIn} error={loginError} />
    </div>
  );
}
