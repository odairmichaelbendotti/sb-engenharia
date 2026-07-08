import { useEffect, useState } from "react";
import { Mail, User, Loader, ShieldCheck, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useUser } from "../../store/user";
import { useTenants } from "../../store/tenants";
import PasswordInput from "../../components/PasswordInput";
import TenantSelect from "../../components/TenantSelect";
import { toast } from "sonner";

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
          <>
            {/* Header */}
            <h1 className="text-2xl font-semibold text-text-primary">
              Criar conta
            </h1>
            <p className="text-text-secondary text-sm mt-1 mb-5">
              Preencha os dados abaixo para começar
            </p>

            {/* Form */}
            <form onSubmit={handleNextStep} className="space-y-3">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nome
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 border border-border rounded-lg bg-surface-muted focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition">
                  <User size={18} className="text-text-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  E-mail
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 border border-border rounded-lg bg-surface-muted focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition">
                  <Mail size={18} className="text-text-muted shrink-0" />
                  <input
                    type="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Senha
                </label>
                <PasswordInput value={password} onChange={setPassword} />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Confirmar senha
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              </div>

              {/* Next Button */}
              <button
                type="submit"
                className="w-full mt-4 cursor-pointer bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-text-inverse font-medium py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                Continuar
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            {/* Big soft icon */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <ShieldCheck size={36} className="text-primary-300" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold text-text-primary">
                Quase lá
              </h1>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Escolha a organização à qual você pertence. Após o cadastro,
                um administrador dessa organização precisará aprovar seu
                acesso antes que você possa entrar na plataforma.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Organização
                </label>
                <TenantSelect
                  tenants={tenants}
                  value={tenantId}
                  onChange={setTenantId}
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="cursor-pointer py-2.5 px-4 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-muted transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 cursor-pointer bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:bg-border text-text-inverse font-medium py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    "Cadastrar"
                  )}
                </button>
              </div>
            </form>
          </>
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
