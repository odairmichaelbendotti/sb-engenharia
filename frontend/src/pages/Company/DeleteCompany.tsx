import type { Empresa } from "../../../types/empresa";
import { maskCnpj } from "../../utils/masks";
import { ConfirmDialog } from "../../components/ui";

type DeleteCompanyProps = {
  isOpen: boolean;
  handleClose: () => void;
  empresaParaDeletar: Empresa;
  handleDelete: (id: string) => void;
  isLoading: boolean;
};

const DeleteCompany = ({ isOpen, handleClose, empresaParaDeletar, handleDelete, isLoading }: DeleteCompanyProps) => {
  if (!isOpen) return null;
  const empenhos = empresaParaDeletar.empenhos.length;
  const blocked = empenhos > 0;

  return (
    <ConfirmDialog
      open
      title={`Excluir a empresa ${empresaParaDeletar.name}?`}
      confirmLabel="Excluir empresa"
      loading={isLoading}
      confirmDisabled={blocked}
      onConfirm={() => handleDelete(empresaParaDeletar.id)}
      onCancel={handleClose}
    >
      <p>CNPJ {maskCnpj(empresaParaDeletar.cnpj)}. Esta ação não pode ser desfeita.</p>
      {blocked && (
        <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-text">
          A empresa tem {empenhos} {empenhos === 1 ? "empenho vinculado" : "empenhos vinculados"}. Exclua ou realoque os
          contratos e empenhos antes de excluir a empresa.
        </p>
      )}
    </ConfirmDialog>
  );
};

export default DeleteCompany;
