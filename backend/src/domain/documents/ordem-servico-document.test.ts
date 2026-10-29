import { describe, expect, it } from "vitest";
import { calcularTermino } from "../entities/OrdemServico.js";
import {
  buildOrcamentoPlanilha,
  buildOrdemServicoDocumentModel,
  formatCnpj,
  formatDataExtensa,
  formatPercentual,
  numeroPorExtenso,
} from "./ordem-servico-document.js";
import type { OrdemServicoDocumentData } from "../repositories/IOrdemServicoRepository.js";

const dia = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

function sampleData(
  overrides: Partial<OrdemServicoDocumentData["ordemServico"]> = {},
  temOrcamento = false,
): OrdemServicoDocumentData {
  return {
    temOrcamento,
    itens: [],
    regraDesconto: "SIMPLES",
    ordemServico: {
      id: "os-1",
      numero: "OS 010/BAFL/2026-L4",
      valor: 38013.98,
      status: "ATIVO",
      empenho_id: "e-1",
      dataInicio: dia("2026-08-19"),
      dataPrevisaoTermino: dia("2026-10-06"),
      obra_id: null,
      tenant_id: "t-1",
      sequencia: 10,
      anoNumeracao: 2026,
      lote_id: "l-4",
      setorRequisitante: "SCOAM-FL",
      urgencia: "PROGRAMADA",
      dataVistoria: dia("2026-07-31"),
      descricaoProblema: "Cobertura deteriorada.",
      dataEmissao: dia("2026-08-18"),
      prazoMobilizacaoDias: 7,
      prazoDias: 49,
      totalComBdi: 50547.24,
      precoBase: "COM_BDI",
      desconto: 24.8,
      aguardandoEmissao: false,
      fiscalSetorial: "SO RAPHAEL C.",
      fiscalTecnico_id: "f-1",
      fiscalAdministrativo_id: "f-2",
      condicoesEspeciais: [],
      anexos: null,
      comentariosTecnicos: [],
      createdAt: dia("2026-09-24"),
      updatedAt: dia("2026-09-24"),
      ...overrides,
    },
    empenhoDescricao: "Manutenção Predial",
    contrato: {
      identificador: "14/2026",
      ePag: "67272.002300/2026-41",
      etp: "79/2025",
      termoReferencia: "26/2026",
      dataBaseSinapi: "Maio/2026",
      endereco: "Av. Santos Dumont, s/n",
      bdi: 21.19,
      company_id: "c-1",
      company: { name: "AEJ ENGENHARIA LTDA", cnpj: "54960587000100" },
      lotes: [
        { numero: 1, nome: "ADM", desconto: 37.6 },
        { numero: 4, nome: "DO", desconto: 24.8 },
      ],
    },
    obra: {
      nome: "Manutenções na Edificação E-050",
      identificacaoPatrimonial: "E-050",
      idPatrimonialCompleto: "SC.027-67272-E-050",
      apelido: "SCOAM-FL",
      areaConstruida: 60.06,
      estadoConservacao: "Bom",
    },
    lote: { numero: 4, nome: "DO", desconto: 24.8 },
    fiscalTecnico: { nome: "1º SGT FLORIANO", ramal: "5174", email: "florianocaagf@fab.mil.br" },
    fiscalAdministrativo: { nome: "1º TEN BENDOTTI", ramal: "5174", email: "bendottiomb@fab.mil.br" },
    tenant: { city: "Florianópolis", apelido: "BAFL" },
  };
}

describe("numeroPorExtenso", () => {
  it("escreve os dias de prazo", () => {
    expect(numeroPorExtenso(7)).toBe("sete");
    expect(numeroPorExtenso(49)).toBe("quarenta e nove");
    expect(numeroPorExtenso(100)).toBe("cem");
    expect(numeroPorExtenso(120)).toBe("cento e vinte");
    expect(numeroPorExtenso(365)).toBe("trezentos e sessenta e cinco");
  });
});

describe("formatação", () => {
  it("formata datas em UTC, sem cair no dia anterior", () => {
    expect(formatDataExtensa(dia("2026-08-18"))).toBe("18 de agosto de 2026");
  });
  it("formata percentual e CNPJ", () => {
    expect(formatPercentual(21.19)).toBe("21,19%");
    expect(formatPercentual(24.8)).toBe("24,8%");
    expect(formatCnpj("54960587000100")).toBe("54.960.587/0001-00");
  });
});

describe("calcularTermino", () => {
  it("conta o dia de início como o primeiro dia do prazo", () => {
    expect(calcularTermino("2026-08-19", 49)).toBe("2026-10-06");
    expect(calcularTermino("2026-08-19", 1)).toBe("2026-08-19");
  });
});

describe("buildOrdemServicoDocumentModel", () => {
  it("calcula total, total com desconto e marca o lote e a urgência", () => {
    const model = buildOrdemServicoDocumentModel(sampleData());
    expect(model.titulo).toBe("ORDEM DE SERVIÇO (OS) – MANUTENÇÃO PREDIAL BAFL");
    expect(model.orcamento.totalComBdi).toBe("R$ 50.547,24");
    // 50.547,24 / 1,2119 e 50.547,24 x (1 - 0,248)
    expect(model.orcamento.total).toBe("R$ 41.709,08");
    expect(model.orcamento.totalComBdiEDesconto).toBe("R$ 38.011,52");
    expect(model.orcamento.valorDesconto).toBe("R$ 12.535,72");
    expect(model.preco.lotes[1]).toEqual({ lote: "04 – DO", desconto: "24,8%", selecionado: true });
    expect(model.identificacao.lotes.map((l) => l.selecionado)).toEqual([false, true]);
    expect(model.identificacao.urgencias.filter((u) => u.selecionado).map((u) => u.texto)).toEqual([
      "Programada (1-3 meses)",
    ]);
    expect(model.identificacao.edificacao).toBe("SCOAM-FL / SC.027-67272-E-050");
    expect(model.identificacao.areaConstruida).toBe("60,06 m²");
    expect(model.inicio.prazo).toBe("49 (quarenta e nove) dias corridos");
    expect(model.mobilizacao).toEqual({ dias: 7, extenso: "sete" });
    expect(model.objeto).toBe("MANUTENÇÃO PREDIAL BAFL");
    expect(model.cronograma).toEqual({ inicio: "19/08/2026", termino: "06/10/2026" });
    expect(model.fiscais.tecnico).toEqual({
      nome: "1º SGT FLORIANO",
      contato: "Ramal 5174 · florianocaagf@fab.mil.br",
    });
    expect(model.local).toBe("Florianópolis, 18 de agosto de 2026.");
  });

  it("com orçamento, o valor final é o valor da OS (soma dos itens) e o desconto é a diferença", () => {
    const model = buildOrdemServicoDocumentModel(sampleData({}, true));
    expect(model.orcamento.totalComBdi).toBe("R$ 50.547,24");
    expect(model.orcamento.totalComBdiEDesconto).toBe("R$ 38.013,98");
    expect(model.orcamento.valorDesconto).toBe("R$ 12.533,26");
  });

  it("usa o desconto copiado na OS, não o atual do lote", () => {
    const model = buildOrdemServicoDocumentModel({ ...sampleData(), lote: { numero: 4, nome: "DO", desconto: 30 } });
    expect(model.orcamento.totalComBdiEDesconto).toBe("R$ 38.011,52");
  });

  it("deixa em branco o que uma OS antiga não tem e mostra só o valor gravado", () => {
    const model = buildOrdemServicoDocumentModel(
      sampleData({
        totalComBdi: null,
        prazoDias: null,
        urgencia: null,
        dataVistoria: null,
        dataEmissao: null,
        setorRequisitante: null,
        descricaoProblema: null,
        lote_id: null,
      }),
    );
    expect(model.orcamento.total).toBe("");
    expect(model.orcamento.totalComBdi).toBe("");
    expect(model.orcamento.totalComBdiEDesconto).toBe("R$ 38.013,98");
    expect(model.prazo.dias).toBe("");
    expect(model.identificacao.urgencias.some((u) => u.selecionado)).toBe(false);
    expect(model.identificacao.dataVistoria).toBe("");
    expect(model.dataEmissao).toBe("");
  });
});

describe("planilha orçamentária do anexo", () => {
  const item = (ordem: number, overrides: Partial<OrdemServicoDocumentData["itens"][number]> = {}) => ({
    ordem,
    codigo: `C${ordem}`,
    descricao: `Serviço ${ordem}`,
    etapa: null,
    unidade: "m²",
    quantidade: 1_000_000,
    quantidadeSuprimida: 0,
    precoUnitario: 1676,
    valorTotal: null,
    precoReferencia: 2415,
    ...overrides,
  });

  it("sem orçamento não há anexo", () => {
    expect(buildOrcamentoPlanilha({ itens: [], regraDesconto: "SIMPLES", bdi: 21.19, desconto: 30.6 })).toBeNull();
    expect(buildOrdemServicoDocumentModel(sampleData()).planilha).toBeNull();
  });

  it("lista os itens com etapas, supressão, preço com BDI e o total da OS", () => {
    const planilha = buildOrcamentoPlanilha({
      itens: [
        item(1, { etapa: "COBERTURA" }),
        item(2, { etapa: "COBERTURA", quantidadeSuprimida: 400_000 }),
        item(3, { etapa: null, codigo: null, precoReferencia: null, precoUnitario: 2667, quantidade: 2_150_000, valorTotal: 57_340 }),
      ],
      regraDesconto: "SCOAM",
      bdi: 21.19,
      desconto: 30.6,
    })!;
    expect(planilha.comPrecoBdi).toBe(true);
    expect(planilha.linhas[0]).toMatchObject({ item: "1", codigo: "C1", quantidade: "10,00", precoComBdi: "24,15", precoUnitario: "16,76", total: "167,60" });
    // Suprimidos 4 de 10: vale 6
    expect(planilha.linhas[1]).toMatchObject({ quantidade: "6,00", suprimido: "4,00", total: "100,56" });
    // Total ajustado (truncado) e sem preço com BDI
    expect(planilha.linhas[2]).toMatchObject({ codigo: "", quantidade: "21,50", precoComBdi: "", total: "573,40" });
    expect(planilha.etapas).toEqual([{ titulo: "COBERTURA", inicio: 0, subtotal: "268,16" }]);
    expect(planilha.total).toBe("841,56");
    expect(planilha.nota).toContain("valor do desconto e total do item truncados");
  });
});

describe("anexos no documento", () => {
  const itens = [
    {
      ordem: 1,
      codigo: "C1",
      descricao: "Serviço 1",
      etapa: null,
      unidade: "m²",
      quantidade: 1_000_000,
      quantidadeSuprimida: 0,
      precoUnitario: 1676,
      valorTotal: null,
      precoReferencia: 2415,
    },
  ];

  it("OS anterior à escolha: os seis padrão, planilha no anexo I", () => {
    const model = buildOrdemServicoDocumentModel({ ...sampleData({}, true), itens });
    expect(model.anexos.map((a) => a.numero)).toEqual(["I", "II", "III", "IV", "V", "VI"]);
    expect(model.anexos[0]!.titulo).toBe("Planilha Orçamentária Sintética");
    expect(model.planilhaAnexo).toBe("I");
    expect(model.planilha).not.toBeNull();
  });

  it("numera só os marcados; a planilha segue o número do anexo sintético", () => {
    const model = buildOrdemServicoDocumentModel({
      ...sampleData(
        {
          anexos: [
            { codigo: "CRONOGRAMA", titulo: "Cronograma Físico-Financeiro", observacao: null },
            { codigo: "PLANILHA_SINTETICA", titulo: "Planilha Orçamentária Sintética", observacao: "Revisão 2" },
          ],
          comentariosTecnicos: ["Conferir prumo"],
        },
        true,
      ),
      itens,
    });
    expect(model.anexos).toEqual([
      { numero: "I", titulo: "Cronograma Físico-Financeiro", observacao: "" },
      { numero: "II", titulo: "Planilha Orçamentária Sintética", observacao: "Revisão 2" },
    ]);
    expect(model.planilhaAnexo).toBe("II");
    expect(model.comentariosTecnicos).toEqual(["Conferir prumo"]);
  });

  it("sem a planilha sintética marcada, o orçamento não vai para o PDF", () => {
    const model = buildOrdemServicoDocumentModel({
      ...sampleData({ anexos: [{ codigo: "CRONOGRAMA", titulo: "Cronograma Físico-Financeiro", observacao: null }] }, true),
      itens,
    });
    expect(model.planilha).toBeNull();
    expect(model.planilhaAnexo).toBe("");
  });
});
