import { useEffect, useState } from "react";
import { Mail, Loader } from "lucide-react";
import { useNavigate } from "react-router";
import { useUser } from "../../../store/user";
import PasswordInput from "../PasswordInput";
import { Button, Field, Input } from "../../../components/ui";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const { signin, fetchUser } = useUser();
  const navigate = useNavigate();

  // Se já existe cookie de sessão válido, não faz sentido mostrar o
  // formulário de login de novo — cai direto no dashboard.
  useEffect(() => {
    let cancelled = false;

    fetchUser()
      .then(() => {
        if (!cancelled) navigate("/", { replace: true });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCheckingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchUser, navigate]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader size={32} className="animate-spin text-text-muted" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    setIsLoading(true);
    e.preventDefault();
    try {
      const response = await signin(email, password);

      if (response) {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-8 shadow-sm">
        {/* Logo */}
        <div className="w-9 h-9 bg-primary-500 rounded-md mb-8" />

        {/* Header */}
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Fazer login
        </h1>
        <p className="text-text-secondary text-sm mt-1 mb-6">
          Preencha os dados abaixo para começar
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="E-mail">
            <Input
              type="email"
              icon={Mail}
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Senha">
            <PasswordInput value={password} onChange={setPassword} />
          </Field>

          <Button type="submit" fullWidth loading={isLoading} className="mt-6">
            Entrar
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-text-secondary text-sm text-center">
            Não possui uma conta?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-text-primary font-semibold underline-offset-2 hover:underline cursor-pointer"
            >
              Criar conta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
