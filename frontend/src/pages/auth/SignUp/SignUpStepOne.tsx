import { Mail, User } from "lucide-react";
import PasswordInput from "../PasswordInput";

type SignUpStepOneProps = {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function SignUpStepOne({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
}: SignUpStepOneProps) {
  return (
    <>
      {/* Header */}
      <h1 className="text-2xl font-semibold text-text-primary">Criar conta</h1>
      <p className="text-text-secondary text-sm mt-1 mb-5">
        Preencha os dados abaixo para começar
      </p>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-3">
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
  );
}
