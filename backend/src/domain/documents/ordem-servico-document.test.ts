import { describe, expect, it } from "vitest";
import { calcularTermino } from "../entities/OrdemServico.js";
import {
  buildOrdemServicoDocumentModel,
  formatCnpj,
  formatDataExtensa,
  formatPercentual,
  numeroPorExtenso,
} from "./ordem-servico-document.js";
import type { OrdemServicoDocumentData } from "../repositories/IOrdemServicoRepository.js";

const dia = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

function sampleData(overrides: Partial<OrdemServicoDocumentData["ordemServico"]> = {}): OrdemServicoDocumentData {
  return {
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
      fiscalSetorial: "SO RAPHAEL C.",
      fiscalTecnico_id: "f-1",
      fiscalAdministrativo_id: "f-2",
      condicoesEspeciais: [],
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
