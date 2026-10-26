import { describe, expect, it } from "vitest";
import type { ItemPlanilha } from "./medicao-calc.js";
import { resumirPlanilha, somarQuantidades } from "./medicao-resumo.js";

// Reboco: 10 m² a R$ 50,00; pintura: 4 m² a R$ 12,50
const reboco: ItemPlanilha = { id: "i-1", descricao: "Reboco", unidade: "m²", quantidade: 10_000, precoUnitario: 5000 };
const pintura: ItemPlanilha = { id: "i-2", descricao: "Pintura", unidade: "m²", quantidade: 4000, precoUnitario: 1250 };

const fim = new Date("2026-09-30T00:00:00Z");

describe("somarQuantidades", () => {
  it("soma por item entre as medições", () => {
    const soma = somarQuantidades([
      { itens: [{ item_id: "i-1", quantidade: 1000 }] },
      { itens: [{ item_id: "i-1", quantidade: 500 }, { item_id: "i-2", quantidade: 200 }] },
    ]);
    expect(soma.get("i-1")).toBe(1500);
    expect(soma.get("i-2")).toBe(200);
  });
});

describe("resumirPlanilha", () => {
  it("OS sem orçamento não está completa", () => {
    const resumo = resumirPlanilha({ itens: [], medicoes: [] });
    expect(resumo).toEqual({
      itens: 0,
      valorOrcado: 0,
      valorMedido: 0,
      completo: false,
      rascunho: null,
      ultimaFechada: null,
    });
  });

  it("medido conta só as fechadas e o rascunho tem o próprio valor", () => {
    const resumo = resumirPlanilha({
      itens: [reboco, pintura],
      medicoes: [
        { id: "m-1", numero: 1, status: "FECHADA", periodoFim: fim, itens: [{ item_id: "i-1", quantidade: 4000 }] },
        { id: "m-2", numero: 2, status: "RASCUNHO", periodoFim: fim, itens: [{ item_id: "i-2", quantidade: 2000 }] },
      ],
    });
    expect(resumo.itens).toBe(2);
    expect(resumo.valorOrcado).toBe(55_000); // 500,00 + 50,00
    expect(resumo.valorMedido).toBe(20_000); // 4 m² de reboco
    expect(resumo.rascunho).toEqual({ id: "m-2", numero: 2, valor: 2500 });
    expect(resumo.ultimaFechada).toEqual({ id: "m-1", numero: 1, periodoFim: fim });
    expect(resumo.completo).toBe(false);
  });

  it("fica completa quando as fechadas medem todo o orçado", () => {
    const resumo = resumirPlanilha({
      itens: [reboco],
      medicoes: [
        { id: "m-1", numero: 1, status: "FECHADA", periodoFim: fim, itens: [{ item_id: "i-1", quantidade: 6000 }] },
        { id: "m-2", numero: 2, status: "FECHADA", periodoFim: fim, itens: [{ item_id: "i-1", quantidade: 4000 }] },
      ],
    });
    expect(resumo.completo).toBe(true);
    expect(resumo.valorMedido).toBe(resumo.valorOrcado);
    expect(resumo.ultimaFechada?.numero).toBe(2);
  });
});
