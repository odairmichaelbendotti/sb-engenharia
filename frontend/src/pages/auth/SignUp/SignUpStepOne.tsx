import { Mail, User } from "lucide-react";
import PasswordInput from "../PasswordInput";
import { Button, Field, Input } from "../../../components/ui";
import { normalizeEmail, normalizeProperName } from "../../../utils/normalization/text-normalizers";

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
      <h1 className="text-xl font-semibold tracking-tight text-text-primary">Criar conta</h1>
      <p className="text-text-secondary text-sm mt-1 mb-5">
        Preencha os dados abaixo para começar
      </p>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Nome">
          <Input
            type="text"
            icon={User}
            placeholder="João Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={(e) => setName(normalizeProperName(e.target.value))}
          />
        </Field>

        <Field label="E-mail">
          <Input
            type="email"
            icon={Mail}
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => setEmail(normalizeEmail(e.target.value))}
          />
        </Field>

        <Field label="Senha">
          <PasswordInput value={password} onChange={setPassword} />
        </Field>

        <Field label="Confirmar senha">
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </Field>

        <Button type="submit" fullWidth className="mt-4">
          Continuar
        </Button>
      </form>
    </>
  );
}
