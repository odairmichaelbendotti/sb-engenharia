import { describe, expect, it } from "vitest";
import {
  aplicarDesconto,
  computeLinhasMedicao,
  computePanorama,
  divergenciaTotal,
  folgaValorTotal,
  fromMilesimos,
  toMilesimos,
  validateMedicaoQuantidades,
  precoComDesconto,
  totaisOrcamento,
  validateOrcamentoChange,
  valorAcumuladoItem,
  valorItem,
  valorOrcadoItem,
  type ItemPlanilha,
  type OrcamentoItemInput,
} from "./medicao-calc.js";

// Reboco: 10 m² a R$ 50,00
const reboco: ItemPlanilha = { id: "i-1", descricao: "Reboco", unidade: "m²", quantidade: 10_000, precoUnitario: 5000, valorTotal: null };
// Pintura: 3,333 m² a R$ 12,34 (valores que não fecham redondo)
const pintura: ItemPlanilha = { id: "i-2", descricao: "Pintura", unidade: "m²", quantidade: 3333, precoUnitario: 1234, valorTotal: null };

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

describe("total ajustado", () => {
  // Pintura com o total da planilha de referência truncado: R$ 41,12 em vez de R$ 41,13
  const truncado: ItemPlanilha = { ...pintura, valorTotal: 4112 };

  it("folga de meio centavo por unidade mais um centavo", () => {
    expect(folgaValorTotal(1000)).toBe(2);
    expect(folgaValorTotal(3333)).toBe(3);
    expect(folgaValorTotal(100_000)).toBe(51);
  });

  it("vale como orçado e como acumulado do item medido por inteiro", () => {
    expect(valorOrcadoItem(truncado)).toBe(4112);
    expect(valorOrcadoItem(pintura)).toBe(4113);
    expect(valorAcumuladoItem(truncado, 3333)).toBe(4112);
    // Parcial segue quantidade × preço, limitado ao total
    expect(valorAcumuladoItem(truncado, 1111)).toBe(valorItem(1111, 1234));
    expect(valorAcumuladoItem({ ...pintura, valorTotal: 1000 }, 1111)).toBe(1000);
  });

  it("a soma das medições bate com o total ajustado, para menos e para mais", () => {
    for (const valorTotal of [4111, 4115]) {
      const item: ItemPlanilha = { ...pintura, valorTotal };
      let anterior = 0;
      let soma = 0;
      for (const esta of [1111, 1111, 1111]) {
        const { linhas } = computeLinhasMedicao({
          itens: [item],
          anterior: qtd([["i-2", anterior]]),
          esta: qtd([["i-2", esta]]),
        });
        expect(linhas[0]!.valorEsta).toBeGreaterThanOrEqual(0);
        soma += linhas[0]!.valorEsta;
        anterior += esta;
      }
      expect(soma).toBe(valorTotal);
    }
  });

  it("o panorama zera o saldo em valor quando o item é medido por inteiro", () => {
    const { itens, totais } = computePanorama({
      itens: [truncado],
      medidoFechado: qtd([["i-2", 3333]]),
      rascunho: qtd(),
    });
    expect(itens[0]).toMatchObject({ valorOrcado: 4112, valorMedido: 4112, valorSaldo: 0 });
    expect(totais.valorOrcado).toBe(4112);
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
    valorTotal: item.valorTotal,
    precoReferencia: null,
    ...overrides,
  });
  const medido = qtd([["i-1", 3000]]);
  const run = (novos: OrcamentoItemInput[]) =>
    validateOrcamentoChange({ atuais: [reboco, pintura], novos, medidoFechado: medido });

  it("aceita incluir item e mexer à vontade no que não foi medido", () => {
    expect(() =>
      run([
        input(reboco, { quantidade: 12_000, descricao: "Reboco interno" }),
        {
          codigo: "87529",
          descricao: "Chapisco",
          unidade: "m²",
          quantidade: 5000,
          precoUnitario: 800,
          valorTotal: null,
          precoReferencia: null,
        },
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
    const novo = {
      codigo: null,
      descricao: "X",
      unidade: "un",
      quantidade: 1000,
      precoUnitario: 100,
      valorTotal: null,
      precoReferencia: null,
    };
    expect(() => run([input(reboco), { ...novo, descricao: "" }])).toThrow(/Item 2: descrição is required/);
    expect(() => run([input(reboco), { ...novo, unidade: "" }])).toThrow(/unidade is required/);
    expect(() => run([input(reboco), { ...novo, quantidade: 0 }])).toThrow(/quantidade/);
    expect(() => run([input(reboco), { ...novo, precoUnitario: -1 }])).toThrow(/preço/);
    expect(() => run([input(reboco), input(reboco)])).toThrow(/sent twice/);
    expect(() => run([input(reboco), { ...novo, id: "outro" }])).toThrow(/not found/);
  });

  it("aceita total ajustado dentro da folga e recusa fora dela", () => {
    // Reboco: 10 m² a R$ 50,00 = R$ 500,00; folga de 5 + 1 centavos
    expect(() => run([input(reboco, { valorTotal: 49_994 }), input(pintura)])).not.toThrow();
    expect(() => run([input(reboco, { valorTotal: 50_006 }), input(pintura)])).not.toThrow();
    expect(() => run([input(reboco, { valorTotal: 50_007 }), input(pintura)])).toThrow(/too far/);
    expect(() => run([input(reboco, { valorTotal: -1 }), input(pintura)])).toThrow(/valor total is invalid/);
  });

  it("recusa ajuste que muda o valor já medido", () => {
    // Pintura medida por inteiro: o medido vale o total, então o total não muda mais
    const inteiro = qtd([["i-2", pintura.quantidade]]);
    const runInteiro = (novos: OrcamentoItemInput[]) =>
      validateOrcamentoChange({ atuais: [pintura], novos, medidoFechado: inteiro });
    expect(() => runInteiro([input(pintura, { valorTotal: 4112 })])).toThrow(/value already measured/);
    // Reboco medido em parte (3 m² = R$ 150,00): ajustar o total não mexe nesse valor
    expect(() => run([input(reboco, { valorTotal: 49_999 }), input(pintura)])).not.toThrow();
  });

  it("com o desconto aplicado pelo sistema, não aceita total ajustado", () => {
    expect(() => run([input(reboco), input(pintura, { precoReferencia: 1500 })])).not.toThrow();
    expect(() => run([input(reboco), input(pintura, { precoReferencia: 1500, valorTotal: 4112 })])).toThrow(
      /discounted prices/,
    );
    expect(() => run([input(reboco), input(pintura, { precoReferencia: -1 })])).toThrow(/preço unitário is invalid/);
  });

  it("recusa mudar o preço de referência de item medido", () => {
    const comReferencia = { ...reboco, precoReferencia: 6000 };
    const runRef = (novos: OrcamentoItemInput[]) =>
      validateOrcamentoChange({ atuais: [comReferencia], novos, medidoFechado: medido });
    expect(() => runRef([input(comReferencia, { precoReferencia: 6000 })])).not.toThrow();
    expect(() => runRef([input(comReferencia, { precoReferencia: 6001 })])).toThrow(/preço unitário/);
  });

  it("permite remover item que só tem quantidade em rascunho", () => {
    expect(() =>
      validateOrcamentoChange({ atuais: [reboco, pintura], novos: [input(reboco)], medidoFechado: qtd() }),
    ).not.toThrow();
  });
});

describe("desconto e totais do orçamento", () => {
  it("aplica o desconto truncando o centavo, sem erro de ponto flutuante", () => {
    // R$ 10,00 com 17% = R$ 8,30 exatos
    expect(precoComDesconto(1000, 17)).toBe(830);
    // R$ 12,34 com 24,8% = 9,27968 → R$ 9,27 (truncado, não arredondado)
    expect(precoComDesconto(1234, 24.8)).toBe(927);
    // Desconto com casas: R$ 100,00 com 17,3456% = 82,6544 → R$ 82,65
    expect(precoComDesconto(10_000, 17.3456)).toBe(8265);
    expect(precoComDesconto(1234, 0)).toBe(1234);
    // Maior valor de uma coluna Int não estoura
    expect(precoComDesconto(2_147_483_647, 10)).toBe(1_932_735_282);
  });

  it("com o desconto aplicado pelo sistema, o total com BDI soma o preço de referência", () => {
    const itens = [
      { quantidade: 2000, precoReferencia: 1000, precoUnitario: precoComDesconto(1000, 17), valorTotal: null },
      { quantidade: 3333, precoReferencia: 1234, precoUnitario: precoComDesconto(1234, 17), valorTotal: null },
    ];
    // 2 × 10,00 + 3,333 × 12,34 = 20,00 + 41,13 / com desconto 2 × 8,30 + 3,333 × 10,24 = 16,60 + 34,13
    expect(totaisOrcamento({ itens, precoBase: "COM_BDI", desconto: 17 })).toEqual({
      totalComBdi: 6113,
      valorOs: 5073,
    });
  });

  it("com o preço já descontado, o total com BDI tira o desconto do valor da OS", () => {
    const itens = [{ quantidade: 1000, precoReferencia: null, precoUnitario: 7520, valorTotal: 7519 }];
    // Total ajustado conta no valor da OS; 75,19 ÷ 0,752 = 99,99
    expect(totaisOrcamento({ itens, precoBase: "COM_BDI_E_DESCONTO", desconto: 24.8 })).toEqual({
      totalComBdi: 9999,
      valorOs: 7519,
    });
  });

  it("aplica outro desconto nos itens com preço de referência (OS antiga recebe o lote)", () => {
    const itens = [
      // Lançado só com BDI quando a OS estava sem lote (desconto 0)
      { id: "a", quantidade: 2000, precoReferencia: 1000, precoUnitario: 1000, valorTotal: null },
      { id: "b", quantidade: 3333, precoReferencia: 1234, precoUnitario: 1234, valorTotal: null },
      // Já com desconto: não muda, nem o total ajustado
      { id: "c", quantidade: 1000, precoReferencia: null, precoUnitario: 7520, valorTotal: 7519 },
    ];
    // 2 × 7,52 + 3,333 × 9,27 (truncado) + 75,19 = 15,04 + 30,90 + 75,19
    expect(aplicarDesconto(itens, 24.8)).toEqual({
      precos: [
        { id: "a", precoUnitario: 752 },
        { id: "b", precoUnitario: 927 },
      ],
      valorOs: 12113,
    });
    // Mesmo desconto: nada muda
    expect(aplicarDesconto(itens, 0).precos).toEqual([]);
  });
});

describe("divergência", () => {
  it("aponta só quando há diferença", () => {
    expect(divergenciaTotal(1000, 1000)).toBeNull();
    expect(divergenciaTotal(1000, 1200)).toEqual({ diferenca: -200 });
  });
});
