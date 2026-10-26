import { describe, expect, it } from "vitest";
import { buildPlanilhaMedicao, calcularPlanilhaMedicao, parsePlanilhaMedicao } from "./planilha-medicao.js";

const pintura = {
  id: "i-1",
  ordem: 1,
  codigo: null,
  descricao: "Pintura",
  unidade: "m²",
  quantidade: 3333,
  precoUnitario: 1234,
  valorTotal: 4112,
};

describe("planilha da medição", () => {
  it("guarda o total ajustado no snapshot", () => {
    const planilha = buildPlanilhaMedicao({
      itens: [pintura],
      anterior: new Map(),
      esta: new Map([["i-1", 3333]]),
      fiscais: { tecnico: null, administrativo: null },
    });
    expect(planilha.itens[0]!.valorTotal).toBe(4112);
    expect(calcularPlanilhaMedicao(planilha).totais).toMatchObject({ valorOrcado: 4112, valorEsta: 4112 });
  });

  it("lê snapshot antigo, sem o total ajustado, como quantidade × preço", () => {
    const antigo = parsePlanilhaMedicao({
      versao: 1,
      itens: [
        { item_id: "i-1", ordem: 1, codigo: null, descricao: "Pintura", unidade: "m²", orcado: 3333, precoUnitario: 1234, anterior: 0, esta: 3333 },
      ],
      fiscais: { tecnico: null, administrativo: null },
    });
    expect(calcularPlanilhaMedicao(antigo!).totais).toMatchObject({ valorOrcado: 4113, valorEsta: 4113 });
  });
});
