import type { OrdemServicoUrgenciaValue } from "../entities/OrdemServico.js";
import type { OrdemServicoDocumentData } from "../repositories/IOrdemServicoRepository.js";

// Item de uma lista de opções do documento ("[ X ] 04 - DO"), com a marcada em destaque
export type DocumentOption = { texto: string; selecionado: boolean };

// Tudo o que o PDF mostra, já formatado. Valores vazios ficam como string vazia (OS antigas)
export type OrdemServicoDocumentModel = {
  titulo: string;
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
    lotes: DocumentOption[];
    bdi: string;
  };
  orcamento: {
    total: string;
    totalComBdi: string;
    totalComBdiEDesconto: string;
    bdi: string;
    desconto: string;
    dataBaseSinapi: string;
  };
  prazo: { dias: string };
  condicoesEspeciais: string[];
  fiscais: { tecnico: string; administrativo: string; setorial: string };
  inicio: { data: string; prazo: string };
  assinaturas: { empresa: string; cnpj: string; fiscalTecnico: string };
  local: string;
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
function formatEdificacao(obra: OrdemServicoDocumentData["obra"]): string {
  if (!obra) return "";
  const partes = [obra.apelido, obra.idPatrimonialCompleto].filter((p): p is string => Boolean(p));
  return partes.length > 0 ? partes.join(" / ") : obra.identificacaoPatrimonial;
}

function formatFiscal(fiscal: { nome: string; ramal: string; email: string } | null): string {
  return fiscal ? `${fiscal.nome} – ${fiscal.ramal} / ${fiscal.email}` : "";
}

export function buildOrdemServicoDocumentModel(data: OrdemServicoDocumentData): OrdemServicoDocumentModel {
  const { ordemServico: os, contrato, lote, obra, tenant } = data;
  const bdi = contrato.bdi;
  const desconto = lote?.desconto ?? 0;

  // O usuário informa o total com BDI; o total sem BDI e o final (com desconto do lote) saem dele.
  // OS antiga, sem esse dado, mostra só o valor final já gravado
  const totalComBdi = os.totalComBdi;
  const orcamento =
    totalComBdi !== null
      ? {
          total: formatMoeda(arredondar(totalComBdi / (1 + bdi / 100))),
          totalComBdi: formatMoeda(arredondar(totalComBdi)),
          totalComBdiEDesconto: formatMoeda(arredondar(totalComBdi * (1 - desconto / 100))),
        }
      : { total: "", totalComBdi: "", totalComBdiEDesconto: formatMoeda(os.valor) };

  const empresa = contrato.company.name;
  const cnpj = formatCnpj(contrato.company.cnpj);
  const lotes = (loteSelecionado: boolean) =>
    contrato.lotes.map((l) => ({
      texto: `${String(l.numero).padStart(2, "0")} – ${l.nome}`,
      selecionado: loteSelecionado && l.numero === lote?.numero,
    }));
  const lotesComDesconto: DocumentOption[] = contrato.lotes.map((l) => ({
    texto: `Lote ${String(l.numero).padStart(2, "0")} – ${l.nome} [${formatPercentual(l.desconto)}]`,
    selecionado: l.numero === lote?.numero,
  }));

  const prazoDias = os.prazoDias;
  const prazoTexto =
    prazoDias === null ? "" : `${prazoDias} (${numeroPorExtenso(prazoDias)}) dias corridos`;
  const emissao = formatDataExtensa(os.dataEmissao);

  return {
    titulo: `ORDEM DE SERVIÇO (OS) – ${data.empenhoDescricao.toLocaleUpperCase("pt-BR")} ${tenant.apelido.toLocaleUpperCase("pt-BR")}`,
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
    condicoesEspeciais: os.condicoesEspeciais,
    fiscais: {
      tecnico: formatFiscal(data.fiscalTecnico),
      administrativo: formatFiscal(data.fiscalAdministrativo),
      setorial: os.fiscalSetorial ?? "",
    },
    inicio: { data: formatDataExtensa(os.dataInicio), prazo: prazoTexto },
    assinaturas: { empresa, cnpj, fiscalTecnico: data.fiscalTecnico?.nome ?? "" },
    local: `${tenant.city}${emissao ? `, ${emissao}` : ""}.`,
  };
}
