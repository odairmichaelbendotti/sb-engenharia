import { describe, expect, it } from "vitest";
import { buildPlanilhaMedicao, calcularPlanilhaMedicao, gruposPorEtapa, parsePlanilhaMedicao } from "./planilha-medicao.js";

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

  it("guarda a supressão no snapshot; o antigo, sem ela, vale a quantidade inteira", () => {
    const planilha = buildPlanilhaMedicao({
      itens: [{ ...pintura, valorTotal: null, quantidadeSuprimida: 1333 }],
      anterior: new Map(),
      esta: new Map(),
      fiscais: { tecnico: null, administrativo: null },
    });
    expect(planilha.itens[0]).toMatchObject({ orcado: 3333, suprimido: 1333 });
    expect(calcularPlanilhaMedicao(planilha).linhas[0]).toMatchObject({ orcado: 2000, suprimido: 1333, valorOrcado: 2468 });
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

describe("grupos por etapa", () => {
  it("junta os itens seguidos da mesma etapa, na ordem da planilha", () => {
    const itens = [
      { id: "1", etapa: "Remoção" },
      { id: "2", etapa: "Remoção" },
      { id: "3", etapa: "Cobertura" },
      // A mesma etapa mais adiante abre outro grupo (ex.: remoção do forro depois da cobertura)
      { id: "4", etapa: "Remoção" },
      { id: "5", etapa: null },
      { id: "6" },
    ];
    expect(gruposPorEtapa(itens).map((g) => [g.etapa, g.itens.map((i) => i.id)])).toEqual([
      ["Remoção", ["1", "2"]],
      ["Cobertura", ["3"]],
      ["Remoção", ["4"]],
      [null, ["5", "6"]],
    ]);
  });

  it("leva a etapa do snapshot para as linhas (snapshot antigo sai sem etapa)", () => {
    const planilha = buildPlanilhaMedicao({
      itens: [{ ...pintura, etapa: "Acabamento" }],
      anterior: new Map(),
      esta: new Map(),
      fiscais: { tecnico: null, administrativo: null },
    });
    expect(calcularPlanilhaMedicao(planilha).linhas[0]!.etapa).toBe("Acabamento");
    const antigo = { ...planilha, itens: planilha.itens.map(({ etapa: _etapa, ...i }) => i) };
    expect(calcularPlanilhaMedicao(antigo).linhas[0]!.etapa).toBeNull();
  });
});
