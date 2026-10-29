import { describe, expect, it } from "vitest";
import { isEmitida, isPlanejada, valorEstimado, valorPlanejado } from "./os-planejada.js";

describe("OS planejada", () => {
  it("planejada é a ativa ainda não emitida; só a emitida entra nos totais", () => {
    expect(isPlanejada({ status: "ATIVO", aguardandoEmissao: true })).toBe(true);
    expect(isPlanejada({ status: "CANCELADO", aguardandoEmissao: true })).toBe(false);
    expect(isPlanejada({ status: "ATIVO", aguardandoEmissao: false })).toBe(false);
    expect(isEmitida({ aguardandoEmissao: true })).toBe(false);
    expect(isEmitida({ aguardandoEmissao: false })).toBe(true);
  });

  it("estimativa leva o desconto do lote, arredondada no centavo", () => {
    expect(valorEstimado(1_000_000, 24.8)).toBe(752_000);
    // 12.034.088 × 0,752 = 9.049.634,18 (o orçado da L4 linha a linha deu 9.049.635)
    expect(valorEstimado(12_034_088, 24.8)).toBe(9_049_634);
    expect(valorEstimado(333, 37.6)).toBe(208);
    expect(valorEstimado(1_000_000, 0)).toBe(1_000_000);
    expect(valorEstimado(null, 24.8)).toBeNull();
  });

  it("valor planejado: o orçado vence a estimativa; sem os dois é zero", () => {
    expect(valorPlanejado({ orcado: 9_049_635, estimativaComBdi: 1_000_000, desconto: 24.8 })).toBe(9_049_635);
    expect(valorPlanejado({ orcado: null, estimativaComBdi: 1_000_000, desconto: 24.8 })).toBe(752_000);
    expect(valorPlanejado({ orcado: null, estimativaComBdi: null, desconto: 24.8 })).toBe(0);
  });
});
