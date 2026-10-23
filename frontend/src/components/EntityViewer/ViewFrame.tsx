import type { ReactNode } from "react";
import { Edit2, Loader2, SearchX } from "lucide-react";
import { Button, Modal, ModalBody, ModalEntityHeader, ModalFooter, type ModalSize } from "../ui";

// O que toda visualização recebe do EntityViewer
export type ViewProps = {
  id: string;
  // Registro anterior na pilha (aberto por um vínculo): mostra "Voltar para ..."
  back: { label: string; onClick: () => void } | null;
  onClose: () => void;
  // "Editar" da página aberta, quando ela tem o formulário deste tipo de registro
  onEdit?: () => void;
};

interface ViewFrameProps extends Omit<ViewProps, "id"> {
  size?: ModalSize;
  accent?: string | null;
  eyebrow?: ReactNode;
  title?: ReactNode;
  // Ações extras no cabeçalho (ex.: Baixar PDF)
  headerActions?: ReactNode;
  // Ações extras no rodapé, antes do Editar (ex.: Marcar como paga)
  footerActions?: ReactNode;
  editLabel?: string;
  loading?: boolean;
  // Registro não existe (excluído, ou fora do acesso de quem abriu)
  notFound?: boolean;
  children?: ReactNode;
}

/**
 * Casca dos modais de visualização: cabeçalho padrão, corpo com seções e rodapé com
 * Fechar e Editar. Cada tipo de registro só preenche tiles, seções e vínculos.
 */
export function ViewFrame({
  size = "lg",
  accent,
  eyebrow,
  title,
  headerActions,
  footerActions,
  editLabel = "Editar",
  back,
  onClose,
  onEdit,
  loading = false,
  notFound = false,
  children,
}: ViewFrameProps) {
  const empty = loading || notFound;

  return (
    <Modal open size={size} onClose={onClose}>
      <ModalEntityHeader
        accent={empty ? null : accent}
        eyebrow={empty ? null : eyebrow}
        title={loading ? "Carregando..." : notFound ? "Registro não encontrado" : title}
        actions={empty ? null : headerActions}
        back={back}
        onClose={onClose}
      />
      <ModalBody className="space-y-6">
        {loading ? (
          <div className="py-10 flex flex-col items-center gap-3 text-text-secondary text-sm">
            <Loader2 size={28} className="animate-spin text-text-muted" />
            Carregando informações...
          </div>
        ) : notFound ? (
          <div className="py-10 flex flex-col items-center gap-2 text-center">
            <SearchX size={28} className="text-text-muted" />
            <p className="text-sm text-text-secondary">Este registro não existe mais ou você não tem acesso a ele.</p>
          </div>
        ) : (
          children
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
        {!empty && footerActions}
        {!empty && onEdit && (
          <Button icon={Edit2} onClick={onEdit}>
            {editLabel}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

// Mensagem padrão das seções sem itens
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-text-muted">{children}</p>;
}
