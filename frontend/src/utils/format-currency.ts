export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("pt-BR");
};

// Datas sem horário (ex.: início da obra) são gravadas como meia-noite UTC; formatar
// no fuso local mostraria o dia anterior no Brasil
export const formatDateOnly = (date: string | Date) => {
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

export const formatDateTime = (date: string | Date) => {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
