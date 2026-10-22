import {
  Trash2,
  AlertTriangle,
  Building2,
  Hash,
  Layers2,
} from "lucide-react";
import type { Empresa } from "../../../types/empresa";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/ui";

type DeleteCompanyProps = {
  isOpen: boolean;
  handleClose: () => void;
  empresaParaDeletar: Empresa;
  handleDelete: (id: string) => void;
  isLoading: boolean;
};

const DeleteCompany = ({
  isOpen,
  handleClose,
  empresaParaDeletar,
  handleDelete,
  isLoading,
}: DeleteCompanyProps) => {
  if (!isOpen) return null;

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
  };

  return (
    <Modal open size="sm" onClose={handleClose}>
      <ModalHeader
        icon={AlertTriangle}
        title="Excluir Empresa Permanentemente"
        description="Esta ação não poderá ser desfeita"
        onClose={handleClose}
      />

      <ModalBody className="space-y-4">
        {/* Dados da empresa */}
        <div className="bg-surface-muted rounded-xl p-4 border border-border">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 bg-surface border border-border rounded-lg flex items-center justify-center shrink-0">
              <Building2 size={16} className="text-text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-0.5">Razão Social</p>
              <p className="text-base font-semibold text-text-primary">
                {empresaParaDeletar.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Hash size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-secondary">CNPJ</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatCNPJ(empresaParaDeletar.cnpj)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Layers2 size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-secondary">Empenhos Vinculados</p>
                <p className="text-sm font-medium text-text-primary">
                  {empresaParaDeletar.empenhos.length} empenho
                  {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso */}
        {empresaParaDeletar.empenhos.length > 0 ? (
          <div className="bg-danger-bg border border-danger-border rounded-lg p-3">
            <p className="text-xs text-danger-text">
              <span className="font-semibold">Atenção:</span> esta empresa
              possui {empresaParaDeletar.empenhos.length} empenho
              {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""} vinculado
              {empresaParaDeletar.empenhos.length !== 1 ? "s" : ""}. Exclua ou
              realoque os contratos/empenhos antes de excluir a empresa.
            </p>
          </div>
        ) : (
          <p className="text-center text-text-secondary text-sm">
            Deseja realmente prosseguir com a exclusão?
          </p>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          icon={Trash2}
          loading={isLoading}
          disabled={empresaParaDeletar.empenhos.length > 0}
          onClick={() => handleDelete(empresaParaDeletar.id)}
        >
          Sim, Excluir Empresa
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteCompany;
