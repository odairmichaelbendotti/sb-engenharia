import type { OrdemServicoStatus } from "./ordem-servico";

export type MedicaoStatus = "RASCUNHO" | "FECHADA";

// Por que não dá para lançar uma medição agora
export type MotivoBloqueioMedicao = "SEM_PERMISSAO" | "OS_INATIVA" | "SEM_ORCAMENTO" | "RASCUNHO_ABERTO" | "SEM_SALDO";

// Item da planilha orçamentária com o panorama (quantidades decimais, valores em reais)
export interface OrcamentoItem {
  id: string;
  ordem: number;
  codigo: string | null;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
  // Soma das medições fechadas
  medido: number;
  valorMedido: number;
  saldo: number;
  valorSaldo: number;
  // Quantidade no rascunho aberto (a empresa recebe sempre 0)
  rascunho: number;
  excedeSaldo: boolean;
  completo: boolean;
}

export interface MedicaoResumo {
  id: string;
  ordemServico_id: string;
  numero: number;
  status: MedicaoStatus;
  periodoInicio: string;
  periodoFim: string;
  observacao: string | null;
  valor: number;
  createdAt: string;
  criadoPorNome: string;
  fechadaEm: string | null;
  fechadaPorNome: string | null;
  reabertaEm: string | null;
  reabertaPorNome: string | null;
}

// GET /ordem-servico/:id/orcamento
// Identificação da OS nas telas de orçamento e medição
export interface MedicaoOsInfo {
  id: string;
  numero: string;
  status: OrdemServicoStatus;
  dataInicio: string | null;
  dataPrevisaoTermino: string | null;
  // Título da OS sem obra
  descricaoEmpenho: string;
  obra: { id: string; nome: string } | null;
  contrato: { id: string; identificador: string; cor: string };
  empresa: { id: string; name: string };
}

export interface PlanilhaOrcamento {
  ordemServico: MedicaoOsInfo;
  itens: OrcamentoItem[];
  totais: { valorOrcado: number; valorMedido: number; valorSaldo: number; valorRascunho: number };
  // Valor final da OS (com BDI e desconto do lote) e a diferença da soma dos itens; nulos para quem não edita
  valorOs: number | null;
  divergencia: { diferenca: number } | null;
  medicoes: (MedicaoResumo & { podeReabrir: boolean })[];
  // Sugestão de início da próxima medição (dia seguinte ao fim da última fechada)
  proximoPeriodoInicio: string | null;
  permissoes: {
    editarOrcamento: boolean;
    criarMedicao: boolean;
    editarMedicoes: boolean;
    motivo: MotivoBloqueioMedicao | null;
  };
}

export interface MedicaoLinha {
  item_id: string;
  ordem: number;
  codigo: string | null;
  descricao: string;
  unidade: string;
  precoUnitario: number;
  orcado: number;
  // Acumulado das medições fechadas antes desta
  anterior: number;
  esta: number;
  acumulado: number;
  saldo: number;
  valorOrcado: number;
  valorAnterior: number;
  valorEsta: number;
  valorAcumulado: number;
  valorSaldo: number;
}

// GET /medicao/:id — na fechada, a planilha congelada no fechamento
export interface MedicaoDetalhe extends MedicaoResumo {
  ordemServico: { id: string; numero: string; status: OrdemServicoStatus };
  linhas: MedicaoLinha[];
  totais: { valorOrcado: number; valorAnterior: number; valorEsta: number; valorAcumulado: number; valorSaldo: number };
  fiscais: { tecnico: string | null; administrativo: string | null };
  permissoes: { editar: boolean; fechar: boolean; excluir: boolean };
}

export interface OrcamentoItemPayload {
  id?: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
}

export interface MedicaoPayload {
  periodoInicio: string;
  periodoFim: string;
  observacao: string;
  itens: { item_id: string; quantidade: number }[];
}

// GET /medicao/painel — uma linha por OS na tela de medições (valores em reais)
export interface PainelMedicaoItem extends MedicaoOsInfo {
  empenhos: { id: string; numero: string }[];
  // Valor final da OS (com BDI e desconto do lote)
  valorOs: number;
  itens: number;
  valorOrcado: number;
  // Só medições fechadas
  valorMedido: number;
  // Todos os itens medidos até o fim
  completo: boolean;
  rascunho: { id: string; numero: number; valor: number } | null;
  ultimaFechada: { id: string; numero: number; periodoFim: string } | null;
  // Só para quem edita
  divergencia: { diferenca: number } | null;
  // Edita orçamento e medições (perfil de engenharia, OS ativa da própria organização)
  podeEditar: boolean;
}
