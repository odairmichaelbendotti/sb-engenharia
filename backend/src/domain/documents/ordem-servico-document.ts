import type { OrdemServicoUrgenciaValue } from "../entities/OrdemServico.js";
import { fromQtdInterna, quantidadeEfetiva, valorOrcadoItem } from "../medicao/medicao-calc.js";
import { gruposPorEtapa } from "../medicao/planilha-medicao.js";
import type { OrdemServicoDocumentData } from "../repositories/IOrdemServicoRepository.js";

// Item de uma lista de opções do documento ("[ X ] 04 - DO"), com a marcada em destaque
export type DocumentOption = { texto: string; selecionado: boolean };

// Fiscal do contrato designado na OS; contato = ramal e e-mail
export type DocumentFiscal = { nome: string; contato: string };

// Linha da planilha orçamentária anexa à OS; valores sem "R$" (a coluna já diz)
export type OrcamentoDocumentLinha = {
  item: string;
  codigo: string;
  descricao: string;
  unidade: string;
  // Quantidade efetiva (contratada − suprimida)
  quantidade: string;
  // Quantidade suprimida ("" sem supressão)
  suprimido: string;
  // Preço com BDI informado ("" quando os preços já foram lançados com desconto)
  precoComBdi: string;
  precoUnitario: string;
  total: string;
};

// Faixa de etapa antes da linha `inicio` (índice em `linhas`), com o subtotal dos itens dela
export type OrcamentoDocumentEtapa = { titulo: string; inicio: number; subtotal: string };

export type OrcamentoDocumentPlanilha = {
  linhas: OrcamentoDocumentLinha[];
  // Só os grupos com etapa: orçamento sem etapas sai como lista única
  etapas: OrcamentoDocumentEtapa[];
  // Mostra a coluna do preço com BDI (orçamento lançado só com BDI)
  comPrecoBdi: boolean;
  total: string;
  // Como os preços foram compostos (BDI, desconto e regra)
  nota: string;
};

// Tudo o que o PDF mostra, já formatado. Valores vazios ficam como string vazia (OS antigas)
export type OrdemServicoDocumentModel = {
  titulo: string;
  // Objeto da OS no cabeçalho ("MANUTENÇÃO PREDIAL BAFL")
  objeto: string;
  dataEmissao: string;
  numero: string;
  processo: string;
  empresa: string;
  cnpj: string;
  referencias: string[];
  mobilizacao: { dias: number; extenso: string };
  identificacao: {
    contrato: string;
    etp: string;
    termoReferencia: string;
    lotes: DocumentOption[];
    edificacao: string;
    endereco: string;
    areaConstruida: string;
    estadoConservacao: string;
    setorRequisitante: string;
    urgencias: DocumentOption[];
    dataVistoria: string;
    descricaoProblema: string;
  };
  preco: {
    // Lotes e descontos do contrato; vazio quando o contrato não tem lotes
    lotes: { lote: string; desconto: string; selecionado: boolean }[];
    bdi: string;
  };
  orcamento: {
    total: string;
    totalComBdi: string;
    // Quanto o desconto do lote abate do total com BDI (vazio sem total com BDI)
    valorDesconto: string;
    totalComBdiEDesconto: string;
    bdi: string;
    desconto: string;
    dataBaseSinapi: string;
  };
  prazo: { dias: string };
  // Datas do cronograma da OS em dd/mm/aaaa, para o quadro-resumo
  cronograma: { inicio: string; termino: string };
  condicoesEspeciais: string[];
  fiscais: { tecnico: DocumentFiscal; administrativo: DocumentFiscal; setorial: string };
  inicio: { data: string; prazo: string };
  assinaturas: { empresa: string; cnpj: string; fiscalTecnico: string };
  local: string;
  // Planilha orçamentária lançada no sistema (anexo I); nula quando a OS não tem orçamento
  planilha: OrcamentoDocumentPlanilha | null;
};

export const URGENCIA_LABELS: Record<OrdemServicoUrgenciaValue, string> = {
  EMERGENCIA: "Emergência (Imediato – 24-48h)",
  URGENCIA: "Urgência (1-2 semanas)",
  PROGRAMADA: "Programada (1-3 meses)",
  PREVENTIVA: "Preventiva (Conforme disp. técnica e orçamentária)",
};

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const UNIDADES = [
  "zero",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

/** Número inteiro de 0 a 999 por extenso (dias de prazo): 49 → "quarenta e nove". */
export function numeroPorExtenso(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999) return String(n);
  if (n < 20) return UNIDADES[n]!;
  if (n < 100) {
    const resto = n % 10;
    return DEZENAS[Math.floor(n / 10)]! + (resto ? ` e ${UNIDADES[resto]}` : "");
  }
  if (n === 100) return "cem";
  const resto = n % 100;
  return CENTENAS[Math.floor(n / 100)]! + (resto ? ` e ${numeroPorExtenso(resto)}` : "");
}

// Datas sem horário são gravadas como meia-noite UTC: o dia é o da data em UTC
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDataCurta(date: Date | null): string {
  if (!date) return "";
  return `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

/** "18 de agosto de 2026" */
export function formatDataExtensa(date: Date | null): string {
  if (!date) return "";
  return `${date.getUTCDate()} de ${MESES[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}

const numberFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatMoeda(value: number): string {
  return `R$ ${numberFormat.format(value)}`;
}

/** 21.19 → "21,19%"; 24.8 → "24,8%" */
export function formatPercentual(value: number): string {
  return `${percentFormat.format(value)}%`;
}

export function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function arredondar(value: number): number {
  return Math.round(value * 100) / 100;
}

/** "SCOAM-FL / SC.027-67272-E-050"; sem os dados novos da obra, cai na identificação patrimonial. */
export function formatEdificacao(
  obra: Pick<NonNullable<OrdemServicoDocumentData["obra"]>, "apelido" | "idPatrimonialCompleto" | "identificacaoPatrimonial"> | null,
): string {
  if (!obra) return "";
  const partes = [obra.apelido, obra.idPatrimonialCompleto].filter((p): p is string => Boolean(p));
  return partes.length > 0 ? partes.join(" / ") : obra.identificacaoPatrimonial;
}

// A conta usa 5 casas; o documento mostra 2
const qtdFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatQtd(milesimos: number): string {
  return qtdFormat.format(fromQtdInterna(milesimos));
}

function valorTabela(centavos: number): string {
  return numberFormat.format(centavos / 100);
}

/** Planilha orçamentária do anexo: itens na ordem, faixas de etapa com subtotal e o total. */
export function buildOrcamentoPlanilha(
  data: Pick<OrdemServicoDocumentData, "itens" | "regraDesconto"> & {
    bdi: number;
    desconto: number;
  },
): OrcamentoDocumentPlanilha | null {
  if (data.itens.length === 0) return null;
  const comPrecoBdi = data.itens.some((i) => i.precoReferencia !== null);
  const linhas = data.itens.map(
    (i, index): OrcamentoDocumentLinha => ({
      item: String(index + 1),
      codigo: i.codigo ?? "",
      descricao: i.descricao,
      unidade: i.unidade,
      quantidade: formatQtd(quantidadeEfetiva(i)),
      suprimido: i.quantidadeSuprimida > 0 ? formatQtd(i.quantidadeSuprimida) : "",
      precoComBdi: i.precoReferencia === null ? "" : valorTabela(i.precoReferencia),
      precoUnitario: valorTabela(i.precoUnitario),
      total: valorTabela(valorOrcadoItem(i)),
    }),
  );

  const etapas: OrcamentoDocumentEtapa[] = [];
  let inicio = 0;
  for (const grupo of gruposPorEtapa(data.itens)) {
    if (grupo.etapa !== null) {
      const subtotal = grupo.itens.reduce((acc, i) => acc + valorOrcadoItem(i), 0);
      etapas.push({ titulo: grupo.etapa, inicio, subtotal: valorTabela(subtotal) });
    }
    inicio += grupo.itens.length;
  }

  const total = data.itens.reduce((acc, i) => acc + valorOrcadoItem(i), 0);
  const regra =
    data.regraDesconto === "SCOAM"
      ? "valor do desconto e total do item truncados no centavo"
      : "desconto aplicado sobre o total de cada linha";
  const nota = comPrecoBdi
    ? `Preços com BDI de ${formatPercentual(data.bdi)}; o preço unitário recebe o desconto do lote de ${formatPercentual(data.desconto)} (${regra}).`
    : `Preços unitários com BDI de ${formatPercentual(data.bdi)} e desconto do lote de ${formatPercentual(data.desconto)}.`;
  return { linhas, etapas, comPrecoBdi, total: valorTabela(total), nota };
}

function formatFiscal(fiscal: { nome: string; ramal: string; email: string } | null): DocumentFiscal {
  if (!fiscal) return { nome: "", contato: "" };
  const contato = [fiscal.ramal && `Ramal ${fiscal.ramal}`, fiscal.email].filter(Boolean).join(" · ");
  return { nome: fiscal.nome, contato };
}

export function buildOrdemServicoDocumentModel(data: OrdemServicoDocumentData): OrdemServicoDocumentModel {
  const { ordemServico: os, contrato, lote, obra, tenant } = data;
  const bdi = contrato.bdi;
  // Desconto copiado do lote na criação da OS
  const desconto = os.desconto;

  // Com orçamento, o total com BDI sai dos itens e o valor final é a soma deles (preços com desconto,
  // calculados item a item), igual ao valor da OS. OS antiga sem orçamento: total com BDI informado e
  // final = total × (1 − desconto). Sem total com BDI, só o valor final já gravado
  const totalComBdi = os.totalComBdi;
  const valorFinal =
    totalComBdi === null ? null : data.temOrcamento ? os.valor : arredondar(totalComBdi * (1 - desconto / 100));
  const orcamento =
    totalComBdi !== null && valorFinal !== null
      ? {
          total: formatMoeda(arredondar(totalComBdi / (1 + bdi / 100))),
          totalComBdi: formatMoeda(arredondar(totalComBdi)),
          // Diferença dos valores já arredondados, para a conta fechar no papel
          valorDesconto: formatMoeda(arredondar(arredondar(totalComBdi) - valorFinal)),
          totalComBdiEDesconto: formatMoeda(valorFinal),
        }
      : { total: "", totalComBdi: "", valorDesconto: "", totalComBdiEDesconto: formatMoeda(os.valor) };

  const empresa = contrato.company.name;
  const cnpj = formatCnpj(contrato.company.cnpj);
  const lotes = (loteSelecionado: boolean) =>
    contrato.lotes.map((l) => ({
      texto: `${String(l.numero).padStart(2, "0")} – ${l.nome}`,
      selecionado: loteSelecionado && l.numero === lote?.numero,
    }));
  const lotesComDesconto = contrato.lotes.map((l) => ({
    lote: `${String(l.numero).padStart(2, "0")} – ${l.nome}`,
    desconto: formatPercentual(l.desconto),
    selecionado: l.numero === lote?.numero,
  }));

  const prazoDias = os.prazoDias;
  const prazoTexto =
    prazoDias === null ? "" : `${prazoDias} (${numeroPorExtenso(prazoDias)}) dias corridos`;
  const emissao = formatDataExtensa(os.dataEmissao);

  const objeto = `${data.empenhoDescricao.toLocaleUpperCase("pt-BR")} ${tenant.apelido.toLocaleUpperCase("pt-BR")}`;

  return {
    titulo: `ORDEM DE SERVIÇO (OS) – ${objeto}`,
    objeto,
    dataEmissao: emissao,
    numero: os.numero,
    processo: contrato.ePag,
    empresa,
    cnpj,
    referencias: [
      `01. e-PAG: ${contrato.ePag}`,
      `02. Contrato ${contrato.identificador}`,
      `03. ETP ${contrato.etp}`,
      `04. TR ${contrato.termoReferencia}`,
    ],
    mobilizacao: {
      dias: os.prazoMobilizacaoDias,
      extenso: numeroPorExtenso(os.prazoMobilizacaoDias),
    },
    identificacao: {
      contrato: contrato.identificador,
      etp: contrato.etp,
      termoReferencia: contrato.termoReferencia,
      lotes: lotes(true),
      edificacao: formatEdificacao(obra),
      endereco: contrato.endereco,
      areaConstruida: obra?.areaConstruida != null ? `${numberFormat.format(obra.areaConstruida)} m²` : "",
      estadoConservacao: obra?.estadoConservacao ?? "",
      setorRequisitante: os.setorRequisitante ?? "",
      urgencias: (Object.keys(URGENCIA_LABELS) as OrdemServicoUrgenciaValue[]).map((u) => ({
        texto: URGENCIA_LABELS[u],
        selecionado: os.urgencia === u,
      })),
      dataVistoria: formatDataCurta(os.dataVistoria),
      descricaoProblema: os.descricaoProblema ?? "",
    },
    preco: { lotes: lotesComDesconto, bdi: formatPercentual(bdi) },
    orcamento: {
      ...orcamento,
      bdi: formatPercentual(bdi),
      desconto: formatPercentual(desconto),
      dataBaseSinapi: contrato.dataBaseSinapi,
    },
    prazo: { dias: prazoDias === null ? "" : `${prazoDias} dias corridos` },
    cronograma: { inicio: formatDataCurta(os.dataInicio), termino: formatDataCurta(os.dataPrevisaoTermino) },
    condicoesEspeciais: os.condicoesEspeciais,
    fiscais: {
      tecnico: formatFiscal(data.fiscalTecnico),
      administrativo: formatFiscal(data.fiscalAdministrativo),
      setorial: os.fiscalSetorial ?? "",
    },
    inicio: { data: formatDataExtensa(os.dataInicio), prazo: prazoTexto },
    assinaturas: { empresa, cnpj, fiscalTecnico: data.fiscalTecnico?.nome ?? "" },
    local: `${tenant.city}${emissao ? `, ${emissao}` : ""}.`,
    planilha: buildOrcamentoPlanilha({ itens: data.itens, regraDesconto: data.regraDesconto, bdi, desconto }),
  };
}
