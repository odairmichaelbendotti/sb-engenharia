import {
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
import { Button, Field, IconButton, Input, Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/ui";
import { normalizeEmail, normalizeProperName } from "../../utils/normalization/text-normalizers";

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
    <Modal open size="sm">
      <ModalHeader
        icon={KeyRound}
        title={result ? "Acesso criado" : "Criar Acesso da Empresa"}
        description={result ? "Repasse a senha com segurança" : "Preencha os dados de login"}
        onClose={handleClose}
      />

      <ModalBody className="space-y-4">
        <div className="bg-surface-muted rounded-lg p-3 border border-border flex items-center gap-3">
          <div className="w-9 h-9 bg-surface border border-border rounded-lg flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-text-primary" />
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

            <Field label="E-mail">
              <Input readOnly value={result.email} />
            </Field>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-text-secondary">Senha gerada</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 h-10 flex items-center text-sm font-mono font-semibold text-text-primary bg-surface-muted rounded-lg px-3 border border-border">
                  {result.password}
                </p>
                <IconButton
                  icon={copied ? Check : Copy}
                  label="Copiar senha"
                  variant="secondary"
                  onClick={handleCopyPassword}
                />
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
            <Field label="Nome do responsável" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setName(normalizeProperName(name))}
                placeholder="Nome de quem vai acessar"
              />
            </Field>
            <Field label="E-mail de acesso" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmail(normalizeEmail(email))}
                placeholder="contato@empresa.com.br"
              />
            </Field>
            <p className="text-xs text-text-muted">
              A senha é gerada automaticamente pelo sistema e mostrada na próxima tela.
            </p>
          </form>
        )}
      </ModalBody>

      <ModalFooter>
        {result ? (
          <Button onClick={handleClose}>Concluir</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={isLoading}>
              Criar Acesso
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
