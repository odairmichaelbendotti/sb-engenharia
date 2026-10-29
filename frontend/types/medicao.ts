import type { OrdemServicoStatus } from "./ordem-servico";

export type MedicaoStatus = "RASCUNHO" | "FECHADA";

// Como os preços do orçamento foram informados: só com BDI (o sistema aplica o desconto da OS,
// truncando o centavo) ou já com BDI e desconto
export type PrecoBase = "COM_BDI" | "COM_BDI_E_DESCONTO";

// Como o desconto é aplicado em cada preço no modo COM_BDI: SIMPLES trunca o preço com desconto;
// SCOAM trunca o valor do desconto e o total do item (planilha SCOAM)
export type RegraDesconto = "SIMPLES" | "SCOAM";

// O que o orçamento representa: a parcela da OS (valor da OS = orçamento) ou o contrato inteiro
// (o orçamento é o valor total e a OS vale o empenhado até aqui)
export type EscopoOrcamento = "ORDEM_SERVICO" | "CONTRATO";

// Por que não dá para lançar uma medição agora
export type MotivoBloqueioMedicao = "SEM_PERMISSAO" | "OS_INATIVA" | "SEM_ORCAMENTO" | "RASCUNHO_ABERTO" | "SEM_SALDO" | "OS_PLANEJADA";

// Item da planilha orçamentária com o panorama (quantidades decimais, valores em reais)
export interface OrcamentoItem {
  id: string;
  ordem: number;
  codigo: string | null;
  descricao: string;
  // Etapa que agrupa o item (itens seguidos com a mesma etapa); null = sem etapa
  etapa: string | null;
  unidade: string;
  // Contratada; a que vale é ela menos a suprimida
  quantidade: number;
  // Supressão: parte da quantidade que saiu do contrato (0 = nenhuma)
  quantidadeSuprimida: number;
  // Preço que vale nas medições (com BDI e desconto)
  precoUnitario: number;
  // Preço com BDI informado, quando o sistema aplicou o desconto (modo COM_BDI)
  precoReferencia: number | null;
  // Total ajustado (quando `totalAjustado`) ou quantidade efetiva × preço
  valorTotal: number;
  // Total digitado para bater com a planilha de referência
  totalAjustado: boolean;
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
  // Criada e ainda não emitida para a empresa (sem orçamento)
  aguardandoEmissao: boolean;
  // Contrato com lotes e OS antiga sem lote: o desconto ficou 0 (só para quem edita)
  semLote: boolean;
}

// Empenho da OS, para repartir o valor do orçamento (só para quem edita)
export interface OrcamentoEmpenho {
  id: string;
  numero: string;
  // Quanto destina hoje à OS
  valor: number;
  // Saldo livre sem contar esta OS
  saldoLivre: number;
}

export interface PlanilhaOrcamento {
  // Com o valor do contrato: teto do orçamento do contrato
  ordemServico: MedicaoOsInfo & { contrato: { valor: number } };
  // Como os preços foram informados e o desconto da OS (porcentagem, copiado do lote)
  precoBase: PrecoBase;
  regraDesconto: RegraDesconto;
  desconto: number;
  escopoOrcamento: EscopoOrcamento;
  // Total com BDI do orçamento (nulo sem itens)
  totalComBdi: number | null;
  empenhos: OrcamentoEmpenho[];
  itens: OrcamentoItem[];
  totais: { valorOrcado: number; valorMedido: number; valorSaldo: number; valorRascunho: number };
  // Valor da OS (soma dos empenhos) e a diferença da soma dos itens; nulos para quem não edita.
  // No orçamento do contrato o valor da OS é o empenhado e não há divergência
  valorOs: number | null;
  divergencia: { diferenca: number } | null;
  // Orçamento do contrato: orçado − empenhado (nulo no escopo da OS)
  faltaEmpenhar: number | null;
  // notaFiscal: nota não cancelada que paga a medição (a medição com nota não reabre nem sai)
  medicoes: (MedicaoResumo & { podeReabrir: boolean; notaFiscal?: { id: string; numero: string } | null })[];
  // Sugestão de início da próxima medição (dia seguinte ao fim da última fechada)
  proximoPeriodoInicio: string | null;
  permissoes: {
    editarOrcamento: boolean;
    // Trocar o modo de preço (travado depois de uma medição fechada)
    trocarPrecoBase: boolean;
    // Emitir a OS para a empresa (aguarda emissão e já tem orçamento)
    emitir: boolean;
    // Salvar o orçamento com outro valor reemite a OS
    reemiteAoMudarValor: boolean;
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
  etapa: string | null;
  unidade: string;
  precoUnitario: number;
  // Quantidade efetiva (contratada − suprimida)
  orcado: number;
  // Supressão do item (0 = nenhuma; ausente em respostas antigas)
  suprimido?: number;
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
  // Vazio = sem etapa
  etapa: string;
  unidade: string;
  quantidade: number;
  // Supressão (0 = nenhuma)
  quantidadeSuprimida: number;
  // Como informado: com BDI (modo COM_BDI) ou com BDI e desconto
  precoUnitario: number;
  // Total ajustado; null = quantidade × preço. Só no modo com desconto (no modo com BDI o backend calcula)
  valorTotal: number | null;
}

export interface OrcamentoPayload {
  precoBase: PrecoBase;
  escopo: EscopoOrcamento;
  itens: OrcamentoItemPayload[];
  // Quanto cada empenho destina à OS: no escopo da OS, quando ela tem mais de um (soma = valor do
  // orçamento); no do contrato, sempre (soma = empenhado, até o orçamento)
  empenhos?: { empenho_id: string; valor: number }[];
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
  // Valor da OS (soma dos empenhos; salvar o orçamento acerta com a soma dos itens). No orçamento do
  // contrato é o empenhado
  valorOs: number;
  // OS planejada: orçado com orçamento, senão a estimativa (nulo na emitida); fora dos totais
  valorPlanejado: number | null;
  escopoOrcamento: EscopoOrcamento;
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
