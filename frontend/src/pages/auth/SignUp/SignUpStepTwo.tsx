import { ArrowLeft, Loader, ShieldCheck } from "lucide-react";
import TenantSelect from "../TenantSelect";
import type { Tenant } from "../../../../types/tenant";

type SignUpStepTwoProps = {
  tenants: Tenant[];
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
      {/* Big soft icon */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-4">
          <ShieldCheck size={36} className="text-primary-300" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">Quase lá</h1>
        <p className="text-text-secondary text-sm mt-2 leading-relaxed">
          Escolha a organização à qual você pertence. Após o cadastro, um
          administrador dessa organização precisará aprovar seu acesso antes
          que você possa entrar na plataforma.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Organização
          </label>
          <TenantSelect tenants={tenants} value={tenantId} onChange={setTenantId} />
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onBack}
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
  );
}
