export interface Empenho {
  id: number;
  numero: string;
  valor: number;
  data: string;
  status: "ativo" | "concluido" | "cancelado";
}
