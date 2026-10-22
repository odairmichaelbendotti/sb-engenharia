import { ArrowLeft, ShieldCheck } from "lucide-react";
import TenantSelect from "../TenantSelect";
import { Button, Field } from "../../../components/ui";
import type { TenantOption } from "../../../../types/tenant";

type SignUpStepTwoProps = {
  tenants: TenantOption[];
  tenantId: string;
  setTenantId: (value: string) => void;
  isLoading: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function SignUpStepTwo({
  tenants,
  tenantId,
  setTenantId,
  isLoading,
  onBack,
  onSubmit,
}: SignUpStepTwoProps) {
  return (
    <>
      {/* Ícone grande e discreto */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-surface-muted border border-border flex items-center justify-center mb-4">
          <ShieldCheck size={36} className="text-text-secondary" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">Quase lá</h1>
        <p className="text-text-secondary text-sm mt-2 leading-relaxed">
          Escolha a organização à qual você pertence. Após o cadastro, um
          administrador dessa organização precisará aprovar seu acesso antes
          que você possa entrar na plataforma.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Organização">
          <TenantSelect tenants={tenants} value={tenantId} onChange={setTenantId} />
        </Field>

        <div className="flex gap-2 mt-6">
          <Button variant="ghost" icon={ArrowLeft} onClick={onBack}>
            Voltar
          </Button>
          <Button type="submit" loading={isLoading} className="flex-1">
            Cadastrar
          </Button>
        </div>
      </form>
    </>
  );
}
