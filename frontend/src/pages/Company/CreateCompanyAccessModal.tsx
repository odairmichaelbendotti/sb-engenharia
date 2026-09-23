import {
  Loader,
  X,
  KeyRound,
  Building2,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Empresa } from "../../../types/empresa";
import { useCompanies } from "../../store/companies";

type CreateCompanyAccessModalProps = {
  empresa: Empresa;
  handleClose: () => void;
};

type Result = {
  name: string;
  email: string;
  password: string;
};

export function CreateCompanyAccessModal({
  empresa,
  handleClose,
}: CreateCompanyAccessModalProps) {
  const { createCompanyAccess } = useCompanies();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email) {
      toast.error("Preencha nome e e-mail");
      return;
    }

    try {
      setIsLoading(true);
      const data = await createCompanyAccess(empresa.id, { name, email });
      setResult({ name: data.user.name, email: data.user.email, password: data.password });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyPassword() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.password);
      setCopied(true);
      toast.success("Senha copiada");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar a senha");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary-100 rounded-xl flex items-center justify-center shrink-0">
              <KeyRound size={18} className="text-secondary-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {result ? "Acesso criado" : "Criar Acesso da Empresa"}
              </h2>
              <p className="text-xs text-text-secondary">
                {result ? "Repasse a senha com segurança" : "Preencha os dados de login"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 cursor-pointer hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        <div className="p-5">
          <div className="bg-surface-muted rounded-lg p-3 mb-4 border border-border flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
              <Building2 size={16} className="text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{empresa.name}</p>
              <p className="text-xs text-text-secondary">
                O acesso será vinculado a esta empresa
              </p>
            </div>
          </div>

          {result ? (
            <div className="space-y-3">
              <div className="bg-success-bg border border-success-border rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success-text shrink-0" />
                <p className="text-xs text-success-text">
                  Login criado para <span className="font-semibold">{result.name}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">E-mail</label>
                <p className="text-sm font-medium text-text-primary bg-surface-muted rounded-lg px-3 py-2 border border-border">
                  {result.email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Senha gerada</label>
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-sm font-mono font-semibold text-text-primary bg-surface-muted rounded-lg px-3 py-2 border border-border">
                    {result.password}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-2.5 cursor-pointer bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shrink-0"
                    title="Copiar senha"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="bg-warning-bg border border-warning-border rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={14} className="text-warning-text shrink-0 mt-0.5" />
                <p className="text-xs text-warning-text">
                  Essa senha não poderá ser vista novamente. Copie e repasse à empresa agora.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Nome do responsável <span className="text-danger-text">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome de quem vai acessar"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  E-mail de acesso <span className="text-danger-text">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                />
              </div>
              <p className="text-xs text-text-muted">
                A senha é gerada automaticamente pelo sistema e mostrada na próxima tela.
              </p>
            </form>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          {result ? (
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 cursor-pointer bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium text-sm"
            >
              Concluir
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 cursor-pointer text-text-secondary bg-surface-muted hover:bg-border rounded-xl transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader className="animate-spin" size={16} /> : "Criar Acesso"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
