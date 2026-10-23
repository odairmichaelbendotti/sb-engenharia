import { useState } from "react";
import { toast } from "sonner";
import { useInvoice, type Invoice } from "../../store/invoices";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { ConfirmDialog } from "../../components/ui";

type DeleteModalProps = {
  deleteInvoice: Invoice | null;
  setDeleteInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
};

export function DeleteModal({ deleteInvoice, setDeleteInvoice }: DeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { delete: deleteInvoiceFn } = useInvoice();

  if (!deleteInvoice) return null;

  async function handleConfirm() {
    if (!deleteInvoice) return;
    setIsLoading(true);
    try {
      await deleteInvoiceFn(deleteInvoice.id);
      toast.success("Nota fiscal excluída com sucesso");
      setDeleteInvoice(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir nota fiscal");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ConfirmDialog
      open
      title={`Excluir a NF ${deleteInvoice.numero}?`}
      confirmLabel="Excluir nota"
      loading={isLoading}
      onConfirm={handleConfirm}
      onCancel={() => setDeleteInvoice(null)}
    >
      <p>
        <span className="font-semibold text-text-primary">{formatCurrency(deleteInvoice.value)}</span> de{" "}
        {deleteInvoice.company?.name ?? "—"}, vencimento em {formatDateOnly(deleteInvoice.vencimento)}. O valor volta ao
        saldo do empenho. Esta ação não pode ser desfeita.
      </p>
    </ConfirmDialog>
  );
}
