import { useState } from "react";
import { toast } from "sonner";
import type { Invoice } from "../../../types/invoice";
import { useInvoice } from "../../store/invoices";
import { formatCurrency } from "../../utils/format-currency";
import { ConfirmDialog } from "../../components/ui";

// Confirmação de "Marcar como paga" (menu ⋯ da linha e modal da nota)
export function MarkPaidDialog({ invoice, open, onClose }: { invoice: Invoice; open: boolean; onClose: () => void }) {
  const update = useInvoice((s) => s.update);
  const [saving, setSaving] = useState(false);

  async function markAsPaid() {
    setSaving(true);
    // O update grava a nota inteira: reenvia os dados atuais trocando só o status
    const payload = {
      numero: invoice.numero,
      description: invoice.description,
      vencimento: invoice.vencimento,
      value: invoice.value,
      empenho_id: invoice.empenho_id,
      company_id: invoice.company_id,
      obra_id: invoice.obra_id ?? undefined,
      ordemServico_id: invoice.ordemServico_id ?? undefined,
      status: "PAGO",
    };
    try {
      await update(invoice.id, payload);
      toast.success(`Nota ${invoice.numero} marcada como paga`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar a nota fiscal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      tone="success"
      title={`Marcar a NF ${invoice.numero} como paga?`}
      confirmLabel="Marcar como paga"
      loading={saving}
      onConfirm={markAsPaid}
      onCancel={onClose}
    >
      <p>
        {formatCurrency(invoice.value)} de {invoice.company?.name ?? "—"}. O status passa para “Paga”; dá para voltar
        pela edição da nota.
      </p>
    </ConfirmDialog>
  );
}
