import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useUser } from "../../../store/user";
import { useTenants } from "../../../store/tenants";
import { toast } from "sonner";
import SignUpStepOne from "./SignUpStepOne";
import SignUpStepTwo from "./SignUpStepTwo";

export default function SignUp() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { user, signup } = useUser();
  const { tenants, listTenants } = useTenants();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    listTenants().catch((error) => {
      console.error(error);
      toast.error("Erro ao carregar organizações");
    });
  }, [listTenants]);

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!tenantId) {
      toast.error("Selecione sua organização");
      return;
    }

    setIsLoading(true);
    try {
      const response = await signup({
        name,
        email,
        password,
        tenant_id: tenantId,
      });
      toast.info(`${response.name.split(" ")[0]}, seja bem-vindo!`);
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 shadow-sm">
        {/* Logo */}
        <div className="w-9 h-9 bg-primary-500 rounded-md mb-6" />

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= 1 ? "bg-primary-500" : "bg-border"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= 2 ? "bg-primary-500" : "bg-border"
            }`}
          />
        </div>

        {step === 1 && (
          <SignUpStepOne
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            onSubmit={handleNextStep}
          />
        )}

        {step === 2 && (
          <SignUpStepTwo
            tenants={tenants}
            tenantId={tenantId}
            setTenantId={setTenantId}
            isLoading={isLoading}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
          />
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-text-secondary text-sm text-center">
            Já possui uma conta?{" "}
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="text-primary-600 font-medium hover:text-primary-500 transition-colors"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
