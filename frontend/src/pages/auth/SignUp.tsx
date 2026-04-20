import { useEffect, useState } from "react";
import { Mail, Lock, User, Loader } from "lucide-react";
import { useNavigate } from "react-router";
import { useUser } from "../../store/user";
import { toast } from "sonner";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { user, signup } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    try {
      const response = await signup(name, email, password);
      toast.info(`${response.name.split(" ")[0]}, seja bem-vindo!`);
      console.log(response);
      navigate("/");
    } catch (error) {
      console.log(error);
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
        <h1 className="text-2xl font-semibold text-text-primary">
          Criar conta
        </h1>
        <p className="text-text-secondary text-sm mt-1 mb-6">
          Preencha os dados abaixo para começar
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center gap-3 px-4 py-2.5 border border-border rounded-lg bg-surface-muted focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition">
              <Lock size={18} className="text-text-muted shrink-0" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Confirmar senha
            </label>
            <div className="flex items-center gap-3 px-4 py-2.5 border border-border rounded-lg bg-surface-muted focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition">
              <Lock size={18} className="text-text-muted shrink-0" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 cursor-pointer bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:bg-border text-text-inverse font-medium py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader className="animate-spin" /> : "Cadastrar"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border">
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
