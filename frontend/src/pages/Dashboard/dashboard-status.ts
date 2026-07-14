export function getStatusConfig(status: string) {
  const configs: Record<
    string,
    { bg: string; text: string; border: string; label: string }
  > = {
    paid: {
      bg: "bg-success-bg",
      text: "text-success-text",
      border: "border-success-border",
      label: "Pago",
    },
    pending: {
      bg: "bg-warning-bg",
      text: "text-warning-text",
      border: "border-warning-border",
      label: "Pendente",
    },
    overdue: {
      bg: "bg-danger-bg",
      text: "text-danger-text",
      border: "border-danger-border",
      label: "Vencido",
    },
    ativo: {
      bg: "bg-success-bg",
      text: "text-success-text",
      border: "border-success-border",
      label: "Ativo",
    },
    concluido: {
      bg: "bg-accent-100",
      text: "text-accent-600",
      border: "border-accent-200",
      label: "Concluído",
    },
    cancelado: {
      bg: "bg-danger-bg",
      text: "text-danger-text",
      border: "border-danger-border",
      label: "Cancelado",
    },
  };
  return configs[status] || configs.pendente;
}
