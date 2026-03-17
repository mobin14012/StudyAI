import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { RegisterForm } from "@/components/auth/RegisterForm";
import type { RegisterFormData } from "@/schemas/auth.schemas";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, registerError, isRegistering } = useAuth();

  async function handleRegister(data: RegisterFormData) {
    await registerUser(data);
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <RegisterForm onSubmit={handleRegister} isLoading={isRegistering} error={registerError} />
    </div>
  );
}
