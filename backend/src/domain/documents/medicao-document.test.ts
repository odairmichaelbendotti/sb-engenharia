import { describe, expect, it } from "vitest";
import { buildMedicaoDocumentModel, formatQuantidade } from "./medicao-document.js";
import { buildPlanilhaMedicao } from "../medicao/planilha-medicao.js";
import type { MedicaoDocumentData, MedicaoResumo } from "../repositories/IMedicaoRepository.js";

const dia = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const itens = [
  { id: "i-1", ordem: 1, codigo: "87529", descricao: "Reboco", unidade: "m²", quantidade: 10_000, precoUnitario: 5000, valorTotal: null },
  { id: "i-2", ordem: 2, codigo: null, descricao: "Pintura", unidade: "m²", quantidade: 20_000, precoUnitario: 1500, valorTotal: null },
];

function sampleData(medicao: Partial<MedicaoResumo> = {}): MedicaoDocumentData {
  return {
    medicao: {
      id: "m-2",
      ordemServico_id: "os-1",
      numero: 2,
      status: "FECHADA",
      periodoInicio: dia("2026-10-01"),
      periodoFim: dia("2026-10-15"),
      observacao: null,
      createdAt: dia("2026-10-16"),
      criadoPorNome: "Fulano",
      // 23h em Brasília: ainda é dia 16 lá, embora já seja 17 em UTC
      fechadaEm: new Date("2026-10-17T02:00:00.000Z"),
      fechadaPorNome: "Fulano",
      reabertaEm: null,
      reabertaPorNome: null,
      itens: [],
      ...medicao,
    },
    planilha: buildPlanilhaMedicao({
      itens,
      anterior: new Map([["i-1", 3000]]),
      esta: new Map([["i-1", 7000]]),
      fiscais: { tecnico: "1º SGT FLORIANO", administrativo: null },
    }),
    ordemServico: { id: "os-1", numero: "OS 010/BAFL/2026-L4", tenant_id: "t-1", descricao: null },
    contrato: {
      identificador: "14/2026",
      ePag: "67272.002300/2026-41",
      company_id: "c-1",
      company: { name: "AEJ ENGENHARIA LTDA", cnpj: "54960587000100" },
    },
    obra: { nome: "Bloco A", identificacaoPatrimonial: "E-050", idPatrimonialCompleto: "SC.027-67272-E-050", apelido: "SCOAM-FL" },
    lote: { numero: 4, nome: "DO" },
    tenant: { city: "Florianópolis" },
  };
}

describe("formatQuantidade", () => {
  it("mostra duas casas e a terceira só quando existe", () => {
    expect(formatQuantidade(3500)).toBe("3,50");
    expect(formatQuantidade(3125)).toBe("3,125");
    expect(formatQuantidade(1_234_000)).toBe("1.234,00");
  });
});

describe("buildMedicaoDocumentModel", () => {
  it("monta o boletim da medição fechada", () => {
    const m = buildMedicaoDocumentModel(sampleData(), dia("2026-10-24"));
    expect(m.titulo).toBe("BOLETIM DE MEDIÇÃO Nº 02 – OS 010/BAFL/2026-L4");
    expect(m.rascunho).toBe(false);
    expect(m.cnpj).toBe("54.960.587/0001-00");
    expect(m.edificacao).toBe("SCOAM-FL / SC.027-67272-E-050");
    expect(m.lote).toBe("04 – DO");
    expect(m.periodo).toEqual({ inicio: "01/10/2026", fim: "15/10/2026" });
    // Data do fechamento no fuso de Brasília
    expect(m.dataFechamento).toBe("16/10/2026");
    expect(m.local).toBe("Florianópolis, 16 de outubro de 2026.");
    expect(m.fiscais).toEqual({ tecnico: "1º SGT FLORIANO", administrativo: "" });
  });

  it("calcula linhas e totais", () => {
    const m = buildMedicaoDocumentModel(sampleData(), dia("2026-10-24"));
    expect(m.linhas[0]).toMatchObject({
      item: "1",
      codigo: "87529",
      orcado: "10,00",
      precoUnitario: "50,00",
      anterior: "3,00",
      esta: "7,00",
      acumulado: "10,00",
      saldo: "0,00",
      valorEsta: "350,00",
      valorSaldo: "0,00",
      medidoNesta: true,
      concluido: true,
    });
    // Item sem movimento: traço nas colunas da medição
    expect(m.linhas[1]).toMatchObject({ anterior: "–", esta: "–", valorEsta: "–", medidoNesta: false, concluido: false });
    expect(m.totais).toEqual({ orcado: "800,00", anterior: "150,00", esta: "350,00", acumulado: "500,00", saldo: "300,00" });
    expect(m.resumo.percentualAcumulado).toBe("62,5%");
    expect(m.resumo.esta).toBe("R$ 350,00");
  });

  it("rascunho sai marcado e com a data de emissão", () => {
    const m = buildMedicaoDocumentModel(
      sampleData({ status: "RASCUNHO", fechadaEm: null, fechadaPorNome: null }),
      new Date("2026-10-24T15:00:00.000Z"),
    );
    expect(m.rascunho).toBe(true);
    expect(m.dataFechamento).toBe("");
    expect(m.local).toBe("Florianópolis, 24 de outubro de 2026.");
  });
});

describe("etapas no boletim", () => {
  it("abre uma faixa por etapa com os subtotais; sem etapas, não há faixa", () => {
    expect(buildMedicaoDocumentModel(sampleData(), dia("2026-10-24")).etapas).toEqual([]);

    const data = sampleData();
    data.planilha = buildPlanilhaMedicao({
      itens: itens.map((i, index) => ({ ...i, etapa: index === 0 ? "Revestimento" : "Pintura" })),
      anterior: new Map([["i-1", 3000]]),
      esta: new Map([["i-1", 7000]]),
      fiscais: { tecnico: null, administrativo: null },
    });
    // Reboco: 10 m² a R$ 50,00, medido por inteiro (350,00 nesta); pintura: 20 m² a R$ 15,00, nada medido
    expect(buildMedicaoDocumentModel(data, dia("2026-10-24")).etapas).toEqual([
      { titulo: "Revestimento", inicio: 0, esta: "350,00", acumulado: "500,00", saldo: "0,00" },
      { titulo: "Pintura", inicio: 1, esta: "0,00", acumulado: "0,00", saldo: "300,00" },
    ]);
  });
});
