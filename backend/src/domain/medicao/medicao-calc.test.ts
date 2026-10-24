import { describe, expect, it } from "vitest";
import {
  computeLinhasMedicao,
  computePanorama,
  divergenciaTotal,
  fromMilesimos,
  toMilesimos,
  validateMedicaoQuantidades,
  validateOrcamentoChange,
  valorFinalOs,
  valorItem,
  type ItemPlanilha,
  type OrcamentoItemInput,
} from "./medicao-calc.js";

// Reboco: 10 m² a R$ 50,00
const reboco: ItemPlanilha = { id: "i-1", descricao: "Reboco", unidade: "m²", quantidade: 10_000, precoUnitario: 5000 };
// Pintura: 3,333 m² a R$ 12,34 (valores que não fecham redondo)
const pintura: ItemPlanilha = { id: "i-2", descricao: "Pintura", unidade: "m²", quantidade: 3333, precoUnitario: 1234 };

const qtd = (entries: [string, number][] = []) => new Map(entries);

describe("milésimos", () => {
  it("converte sem o erro de ponto flutuante", () => {
    expect(toMilesimos(0.1 + 0.2)).toBe(300);
    expect(toMilesimos(3.5)).toBe(3500);
    expect(toMilesimos(1.0005)).toBe(1001);
    expect(fromMilesimos(3500)).toBe(3.5);
  });
});

describe("valorItem", () => {
  it("multiplica quantidade por preço e arredonda meio para cima", () => {
    expect(valorItem(10_000, 5000)).toBe(50_000); // R$ 500,00
    expect(valorItem(3333, 1234)).toBe(4113); // 3,333 × 12,34 = 41,12922
    expect(valorItem(500, 1)).toBe(1); // 0,5 centavo sobe
    expect(valorItem(499, 1)).toBe(0);
  });

  it("não perde precisão com valores grandes", () => {
    // 2.000.000 un × R$ 20.000.000,00 (o produto em milésimos × centavos passa de 2^53)
    expect(valorItem(2_000_000_000, 2_000_000_000)).toBe(4_000_000_000_000_000);
  });
});

describe("computePanorama", () => {
  it("calcula medido, saldo e conclusão", () => {
    const { itens, totais } = computePanorama({
      itens: [reboco, pintura],
      medidoFechado: qtd([["i-1", 3000]]),
      rascunho: qtd([["i-1", 7000]]),
    });
    expect(itens[0]).toMatchObject({ medido: 3000, saldo: 7000, valorMedido: 15_000, valorSaldo: 35_000, completo: false });
    expect(itens[0]!.excedeSaldo).toBe(false);
    expect(itens[1]).toMatchObject({ medido: 0, saldo: 3333, completo: false });
    expect(totais.valorOrcado).toBe(50_000 + 4113);
    expect(totais.valorRascunho).toBe(35_000);
  });

  it("marca item concluído exatamente quando o saldo zera", () => {
    const { itens } = computePanorama({ itens: [reboco], medidoFechado: qtd([["i-1", 10_000]]), rascunho: qtd() });
    expect(itens[0]).toMatchObject({ saldo: 0, valorSaldo: 0, completo: true });
  });

  it("sinaliza rascunho acima do saldo", () => {
    const { itens } = computePanorama({
      itens: [reboco],
      medidoFechado: qtd([["i-1", 8000]]),
      rascunho: qtd([["i-1", 3000]]),
    });
    expect(itens[0]!.excedeSaldo).toBe(true);
  });
});

describe("computeLinhasMedicao", () => {
  it("monta anterior, esta, acumulado e saldo", () => {
    const { linhas, totais } = computeLinhasMedicao({
      itens: [reboco],
      anterior: qtd([["i-1", 3000]]),
      esta: qtd([["i-1", 2500]]),
    });
    expect(linhas[0]).toMatchObject({
      anterior: 3000,
      esta: 2500,
      acumulado: 5500,
      saldo: 4500,
      valorAnterior: 15_000,
      valorEsta: 12_500,
      valorAcumulado: 27_500,
      valorSaldo: 22_500,
    });
    expect(totais.valorEsta).toBe(12_500);
  });

  it("a soma das medições de um item bate com o orçado, centavo a centavo", () => {
    // Três medições de 1,111 m² em 3,333 m² a R$ 12,34: cada uma vale 13,70974 sozinha
    let anterior = 0;
    let soma = 0;
    for (let i = 0; i < 3; i++) {
      const { linhas } = computeLinhasMedicao({
        itens: [pintura],
        anterior: qtd([["i-2", anterior]]),
        esta: qtd([["i-2", 1111]]),
      });
      soma += linhas[0]!.valorEsta;
      anterior += 1111;
    }
    expect(soma).toBe(valorItem(pintura.quantidade, pintura.precoUnitario));
  });
});

describe("validateMedicaoQuantidades", () => {
  const base = { itens: [reboco, pintura], medidoFechado: qtd([["i-1", 3000]]) };

  it("aceita quantidade até o saldo", () => {
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "i-1", quantidade: 7000 }] })).not.toThrow();
  });

  it("recusa quantidade acima do saldo, com o máximo na mensagem", () => {
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "i-1", quantidade: 8000 }] })).toThrow(
      /max 7 m²/,
    );
  });

  it("recusa item concluído, item de fora, repetido e quantidade inválida", () => {
    const concluido = { itens: [reboco], medidoFechado: qtd([["i-1", 10_000]]) };
    expect(() => validateMedicaoQuantidades({ ...concluido, linhas: [{ item_id: "i-1", quantidade: 1 }] })).toThrow(
      /fully measured/,
    );
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "x", quantidade: 1 }] })).toThrow(
      /not in the budget/,
    );
    expect(() =>
      validateMedicaoQuantidades({
        ...base,
        linhas: [
          { item_id: "i-2", quantidade: 1 },
          { item_id: "i-2", quantidade: 1 },
        ],
      }),
    ).toThrow(/twice/);
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "i-2", quantidade: 0 }] })).toThrow(
      /Invalid quantity/,
    );
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "i-2", quantidade: 1.5 }] })).toThrow(
      /Invalid quantity/,
    );
  });
});

describe("validateOrcamentoChange", () => {
  const input = (item: ItemPlanilha, overrides: Partial<OrcamentoItemInput> = {}): OrcamentoItemInput => ({
    id: item.id,
    codigo: null,
    descricao: item.descricao,
    unidade: item.unidade,
    quantidade: item.quantidade,
    precoUnitario: item.precoUnitario,
    ...overrides,
  });
  const medido = qtd([["i-1", 3000]]);
  const run = (novos: OrcamentoItemInput[]) =>
    validateOrcamentoChange({ atuais: [reboco, pintura], novos, medidoFechado: medido });

  it("aceita incluir item e mexer à vontade no que não foi medido", () => {
    expect(() =>
      run([
        input(reboco, { quantidade: 12_000, descricao: "Reboco interno" }),
        { codigo: "87529", descricao: "Chapisco", unidade: "m²", quantidade: 5000, precoUnitario: 800 },
      ]),
    ).not.toThrow();
  });

  it("recusa remover item medido", () => {
    expect(() => run([input(pintura)])).toThrow(/already measured and cannot be removed/);
  });

  it("recusa reduzir abaixo do medido e mudar preço ou unidade de item medido", () => {
    expect(() => run([input(reboco, { quantidade: 2999 })])).toThrow(/lower than what was already measured \(3 m²\)/);
    expect(() => run([input(reboco, { quantidade: 3000 })])).not.toThrow();
    expect(() => run([input(reboco, { precoUnitario: 5100 })])).toThrow(/preço unitário/);
    expect(() => run([input(reboco, { unidade: "m³" })])).toThrow(/unidade/);
  });

  it("valida os campos de cada item", () => {
    const novo = { codigo: null, descricao: "X", unidade: "un", quantidade: 1000, precoUnitario: 100 };
    expect(() => run([input(reboco), { ...novo, descricao: "" }])).toThrow(/Item 2: descrição is required/);
    expect(() => run([input(reboco), { ...novo, unidade: "" }])).toThrow(/unidade is required/);
    expect(() => run([input(reboco), { ...novo, quantidade: 0 }])).toThrow(/quantidade/);
    expect(() => run([input(reboco), { ...novo, precoUnitario: -1 }])).toThrow(/preço/);
    expect(() => run([input(reboco), input(reboco)])).toThrow(/sent twice/);
    expect(() => run([input(reboco), { ...novo, id: "outro" }])).toThrow(/not found/);
  });

  it("permite remover item que só tem quantidade em rascunho", () => {
    expect(() =>
      validateOrcamentoChange({ atuais: [reboco, pintura], novos: [input(reboco)], medidoFechado: qtd() }),
    ).not.toThrow();
  });
});

describe("valor da OS e divergência", () => {
  it("aplica o desconto do lote ao total com BDI", () => {
    expect(valorFinalOs({ totalComBdi: 5_054_724, valor: 0, descontoLote: 24.8 })).toBe(3_801_152);
    expect(valorFinalOs({ totalComBdi: null, valor: 123_45, descontoLote: 24.8 })).toBe(123_45);
  });

  it("aponta só quando há diferença", () => {
    expect(divergenciaTotal(1000, 1000)).toBeNull();
    expect(divergenciaTotal(1000, 1200)).toEqual({ diferenca: -200 });
  });
});
