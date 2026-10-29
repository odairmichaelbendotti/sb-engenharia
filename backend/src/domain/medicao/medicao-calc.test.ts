import { describe, expect, it } from "vitest";
import {
  aplicarDesconto,
  computeLinhasMedicao,
  computePanorama,
  divergenciaTotal,
  folgaValorTotal,
  fromQtdInterna,
  toQtdInterna,
  validateMedicaoQuantidades,
  precoComDesconto,
  quantidadeEfetiva,
  totaisOrcamento,
  totalLinhaComDesconto,
  totalPorRegra,
  manterTotaisAjustados,
  valorItemTruncado,
  validateOrcamentoChange,
  valorAcumuladoItem,
  valorItem,
  valorOrcadoItem,
  type ItemPlanilha,
  type OrcamentoItemInput,
} from "./medicao-calc.js";

// Reboco: 10 m² a R$ 50,00
const reboco: ItemPlanilha = { id: "i-1", descricao: "Reboco", unidade: "m²", quantidade: 1_000_000, precoUnitario: 5000, valorTotal: null };
// Pintura: 3,333 m² a R$ 12,34 (valores que não fecham redondo)
const pintura: ItemPlanilha = { id: "i-2", descricao: "Pintura", unidade: "m²", quantidade: 333_300, precoUnitario: 1234, valorTotal: null };

const qtd = (entries: [string, number][] = []) => new Map(entries);

describe("quantidade com 5 casas", () => {
  it("converte sem o erro de ponto flutuante", () => {
    expect(toQtdInterna(0.1 + 0.2)).toBe(30_000);
    expect(toQtdInterna(3.5)).toBe(350_000);
    // Quantidades das planilhas com mais de 3 casas (OS02L5, OS-01-01)
    expect(toQtdInterna(1.6245)).toBe(162_450);
    expect(toQtdInterna(10.44736)).toBe(1_044_736);
    expect(toQtdInterna(27.55375)).toBe(2_755_375);
    // Mais de 5 casas é arredondado
    expect(toQtdInterna(1.000005)).toBe(100_001);
    expect(fromQtdInterna(350_000)).toBe(3.5);
  });

  it("a conta usa as 5 casas: 1,6245 m³ × 612,61 = 995,18 (truncado, como a planilha)", () => {
    expect(valorItemTruncado(toQtdInterna(1.6245), 61_261)).toBe(99_518);
  });
});

describe("valorItem", () => {
  it("multiplica quantidade por preço e arredonda meio para cima", () => {
    expect(valorItem(1_000_000, 5000)).toBe(50_000); // R$ 500,00
    expect(valorItem(333_300, 1234)).toBe(4113); // 3,333 × 12,34 = 41,12922
    expect(valorItem(50_000, 1)).toBe(1); // 0,5 centavo sobe
    expect(valorItem(49_900, 1)).toBe(0);
  });

  it("não perde precisão com valores grandes", () => {
    // 2.000.000 un × R$ 20.000.000,00 (o produto em milésimos × centavos passa de 2^53)
    expect(valorItem(200_000_000_000, 2_000_000_000)).toBe(4_000_000_000_000_000);
  });
});

describe("computePanorama", () => {
  it("calcula medido, saldo e conclusão", () => {
    const { itens, totais } = computePanorama({
      itens: [reboco, pintura],
      medidoFechado: qtd([["i-1", 300_000]]),
      rascunho: qtd([["i-1", 700_000]]),
    });
    expect(itens[0]).toMatchObject({ medido: 300_000, saldo: 700_000, valorMedido: 15_000, valorSaldo: 35_000, completo: false });
    expect(itens[0]!.excedeSaldo).toBe(false);
    expect(itens[1]).toMatchObject({ medido: 0, saldo: 333_300, completo: false });
    expect(totais.valorOrcado).toBe(50_000 + 4113);
    expect(totais.valorRascunho).toBe(35_000);
  });

  it("marca item concluído exatamente quando o saldo zera", () => {
    const { itens } = computePanorama({ itens: [reboco], medidoFechado: qtd([["i-1", 1_000_000]]), rascunho: qtd() });
    expect(itens[0]).toMatchObject({ saldo: 0, valorSaldo: 0, completo: true });
  });

  it("sinaliza rascunho acima do saldo", () => {
    const { itens } = computePanorama({
      itens: [reboco],
      medidoFechado: qtd([["i-1", 800_000]]),
      rascunho: qtd([["i-1", 300_000]]),
    });
    expect(itens[0]!.excedeSaldo).toBe(true);
  });
});

describe("computeLinhasMedicao", () => {
  it("monta anterior, esta, acumulado e saldo", () => {
    const { linhas, totais } = computeLinhasMedicao({
      itens: [reboco],
      anterior: qtd([["i-1", 300_000]]),
      esta: qtd([["i-1", 250_000]]),
    });
    expect(linhas[0]).toMatchObject({
      anterior: 300_000,
      esta: 250_000,
      acumulado: 550_000,
      saldo: 450_000,
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
        esta: qtd([["i-2", 111_100]]),
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
    expect(folgaValorTotal(100_000)).toBe(2);
    expect(folgaValorTotal(333_300)).toBe(3);
    expect(folgaValorTotal(10_000_000)).toBe(51);
  });

  it("vale como orçado e como acumulado do item medido por inteiro", () => {
    expect(valorOrcadoItem(truncado)).toBe(4112);
    expect(valorOrcadoItem(pintura)).toBe(4113);
    expect(valorAcumuladoItem(truncado, 333_300)).toBe(4112);
    // Parcial segue quantidade × preço, limitado ao total
    expect(valorAcumuladoItem(truncado, 111_100)).toBe(valorItem(111_100, 1234));
    expect(valorAcumuladoItem({ ...pintura, valorTotal: 1000 }, 111_100)).toBe(1000);
  });

  it("a soma das medições bate com o total ajustado, para menos e para mais", () => {
    for (const valorTotal of [4111, 4115]) {
      const item: ItemPlanilha = { ...pintura, valorTotal };
      let anterior = 0;
      let soma = 0;
      for (const esta of [111_100, 111_100, 111_100]) {
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
      medidoFechado: qtd([["i-2", 333_300]]),
      rascunho: qtd(),
    });
    expect(itens[0]).toMatchObject({ valorOrcado: 4112, valorMedido: 4112, valorSaldo: 0 });
    expect(totais.valorOrcado).toBe(4112);
  });
});

describe("validateMedicaoQuantidades", () => {
  const base = { itens: [reboco, pintura], medidoFechado: qtd([["i-1", 300_000]]) };

  it("aceita quantidade até o saldo", () => {
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "i-1", quantidade: 700_000 }] })).not.toThrow();
  });

  it("recusa quantidade acima do saldo, com o máximo na mensagem", () => {
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "i-1", quantidade: 800_000 }] })).toThrow(
      /max 7,00 m²/,
    );
  });

  it("recusa item concluído, item de fora, repetido e quantidade inválida", () => {
    const concluido = { itens: [reboco], medidoFechado: qtd([["i-1", 1_000_000]]) };
    expect(() => validateMedicaoQuantidades({ ...concluido, linhas: [{ item_id: "i-1", quantidade: 100 }] })).toThrow(
      /fully measured/,
    );
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "x", quantidade: 100 }] })).toThrow(
      /not in the budget/,
    );
    expect(() =>
      validateMedicaoQuantidades({
        ...base,
        linhas: [
          { item_id: "i-2", quantidade: 100 },
          { item_id: "i-2", quantidade: 100 },
        ],
      }),
    ).toThrow(/twice/);
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "i-2", quantidade: 0 }] })).toThrow(
      /Invalid quantity/,
    );
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "i-2", quantidade: 100.5 }] })).toThrow(
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
    quantidadeSuprimida: item.quantidadeSuprimida ?? 0,
    precoUnitario: item.precoUnitario,
    valorTotal: item.valorTotal,
    precoReferencia: null,
    ...overrides,
  });
  const medido = qtd([["i-1", 300_000]]);
  const run = (novos: OrcamentoItemInput[]) =>
    validateOrcamentoChange({ atuais: [reboco, pintura], novos, medidoFechado: medido });

  it("aceita incluir item e mexer à vontade no que não foi medido", () => {
    expect(() =>
      run([
        input(reboco, { quantidade: 1_200_000, descricao: "Reboco interno" }),
        {
          codigo: "87529",
          descricao: "Chapisco",
          unidade: "m²",
          quantidade: 500_000,
          quantidadeSuprimida: 0,
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
    expect(() => run([input(reboco, { quantidade: 299_900 })])).toThrow(/lower than what was already measured \(3,00 m²\)/);
    expect(() => run([input(reboco, { quantidade: 300_000 })])).not.toThrow();
    expect(() => run([input(reboco, { precoUnitario: 5100 })])).toThrow(/preço unitário/);
    expect(() => run([input(reboco, { unidade: "m³" })])).toThrow(/unidade/);
  });

  it("valida os campos de cada item", () => {
    const novo = {
      codigo: null,
      descricao: "X",
      unidade: "un",
      quantidade: 100_000,
      quantidadeSuprimida: 0,
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

  it("com o desconto aplicado pelo sistema, o total ajustado também fica dentro da folga", () => {
    expect(() => run([input(reboco), input(pintura, { precoReferencia: 1500 })])).not.toThrow();
    // 3,333 × 12,34 = 41,12922: truncado 41,12 (SCOAM) ou total de planilha antiga
    expect(() => run([input(reboco), input(pintura, { precoReferencia: 1500, valorTotal: 4112 })])).not.toThrow();
    expect(() => run([input(reboco), input(pintura, { precoReferencia: 1500, valorTotal: 4100 })])).toThrow(
      /too far/,
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
  it("preço unitário com desconto simples arredondado no centavo, sem erro de ponto flutuante", () => {
    // R$ 10,00 com 17% = R$ 8,30 exatos
    expect(precoComDesconto(1000, 17)).toBe(830);
    // R$ 12,34 com 24,8% = 9,27968 → R$ 9,28
    expect(precoComDesconto(1234, 24.8)).toBe(928);
    // Desconto com casas: R$ 100,00 com 17,3456% = 82,6544 → R$ 82,65
    expect(precoComDesconto(10_000, 17.3456)).toBe(8265);
    expect(precoComDesconto(1234, 0)).toBe(1234);
    // Maior valor de uma coluna Int não estoura
    expect(precoComDesconto(2_147_483_647, 10)).toBe(1_932_735_282);
  });

  it("com o desconto aplicado pelo sistema, o total com BDI soma o preço de referência", () => {
    const itens = [
      { quantidade: 200_000, precoReferencia: 1000, precoUnitario: precoComDesconto(1000, 17), valorTotal: null },
      { quantidade: 333_300, precoReferencia: 1234, precoUnitario: precoComDesconto(1234, 17), valorTotal: null },
    ];
    // 2 × 10,00 + 3,333 × 12,34 = 20,00 + 41,12 (truncado, como a planilha) / com desconto 16,60 + 34,13
    expect(totaisOrcamento({ itens, precoBase: "COM_BDI", desconto: 17 })).toEqual({
      totalComBdi: 6112,
      valorOs: 5073,
    });
  });

  it("com o preço já descontado, o total com BDI tira o desconto do valor da OS", () => {
    const itens = [{ quantidade: 100_000, precoReferencia: null, precoUnitario: 7520, valorTotal: 7519 }];
    // Total ajustado conta no valor da OS; 75,19 ÷ 0,752 = 99,99
    expect(totaisOrcamento({ itens, precoBase: "COM_BDI_E_DESCONTO", desconto: 24.8 })).toEqual({
      totalComBdi: 9999,
      valorOs: 7519,
    });
  });

  it("aplica outro desconto nos itens com preço de referência (OS antiga recebe o lote)", () => {
    const itens = [
      // Lançado só com BDI quando a OS estava sem lote (desconto 0)
      { id: "a", quantidade: 200_000, precoReferencia: 1000, precoUnitario: 1000, valorTotal: null },
      { id: "b", quantidade: 333_300, precoReferencia: 1234, precoUnitario: 1234, valorTotal: null },
      // Já com desconto: não muda, nem o total ajustado
      { id: "c", quantidade: 100_000, precoReferencia: null, precoUnitario: 7520, valorTotal: 7519 },
    ];
    // Total da linha: 20,00 × 0,752 = 15,04; 3,333 × 12,34 = 41,12 (truncado) × 0,752 = 30,92; + 75,19
    expect(aplicarDesconto(itens, 24.8)).toEqual({
      precos: [
        { id: "a", precoUnitario: 752, valorTotal: null },
        { id: "b", precoUnitario: 928, valorTotal: 3092 },
      ],
      valorOs: 12115,
    });
    // Sem desconto o preço não muda; o total da linha fica o com BDI truncado (41,12, não 41,13)
    expect(aplicarDesconto(itens, 0).precos).toEqual([{ id: "b", precoUnitario: 1234, valorTotal: 4112 }]);
    // SCOAM: 12,34 − TRUNCAR(3,06032) = 9,28; 3,333 × 9,28 = 30,93024 → total truncado 30,93 (igual ao arredondado)
    expect(aplicarDesconto(itens, 24.8, "SCOAM")).toEqual({
      precos: [
        { id: "a", precoUnitario: 752, valorTotal: null },
        { id: "b", precoUnitario: 928, valorTotal: null },
      ],
      valorOs: 12116,
    });
  });

  it("regra SCOAM: trunca o valor do desconto e o total do item", () => {
    // Lote de 30,6%: 24,15 → 16,77 (SCOAM) e 16,76 (simples); 0,77 → 0,54 e 0,53
    expect(precoComDesconto(2415, 30.6, "SCOAM")).toBe(1677);
    expect(precoComDesconto(2415, 30.6)).toBe(1676);
    expect(precoComDesconto(77, 30.6, "SCOAM")).toBe(54);
    expect(precoComDesconto(77, 30.6, "SIMPLES")).toBe(53);
    // 235 × 16,77 = 3.940,95 exato: sem total ajustado
    expect(totalPorRegra({ quantidade: 23_500_000, precoUnitario: 1677, precoReferencia: 2415 }, "SCOAM", 30.6)).toBeNull();
    // 21,5 × 26,67 = 573,405 → 573,40 (o arredondado seria 573,41)
    expect(valorItemTruncado(2_150_000, 2667)).toBe(57_340);
    expect(totalPorRegra({ quantidade: 2_150_000, precoUnitario: 2667, precoReferencia: 3842 }, "SCOAM", 30.6)).toBe(57_340);
    expect(
      totalPorRegra({ quantidade: 2_150_000, quantidadeSuprimida: 50_000, precoUnitario: 2667, precoReferencia: 3842 }, "SCOAM", 30.6),
    ).toBeNull();
  });

  it("desconto simples sobre o total da linha, sem cortar o preço unitário antes (planilha da OS01L3)", () => {
    // 235 × 0,82 = 192,70 × 0,694 = 133,7338 → 133,73 (e não 235 × 0,56 = 131,60)
    expect(totalLinhaComDesconto(23_500_000, 82, 30.6)).toBe(13_373);
    expect(precoComDesconto(82, 30.6)).toBe(57);
    expect(totalPorRegra({ quantidade: 23_500_000, precoUnitario: 57, precoReferencia: 82 }, "SIMPLES", 30.6)).toBe(13_373);
    // 6.384,95 × 0,694 = 4.431,1553 → 4.431,16
    expect(totalLinhaComDesconto(23_500_000, 2717, 30.6)).toBe(443_116);
    // 1 × 54,01 × 0,694 = 37,48: igual a quantidade × preço, sem total ajustado
    expect(totalPorRegra({ quantidade: 100_000, precoUnitario: 3748, precoReferencia: 5401 }, "SIMPLES", 30.6)).toBeNull();
  });

  it("OS01L3 nova (total com BDI 11.303,70, lote de 30,6%): R$ 7.844,76, igual à planilha", () => {
    const planilha: [number, number][] = [
      [100_000, 5401], [100_000, 25624], [23_500_000, 82], [23_500_000, 2717], [2_150_000, 1108], [2_150_000, 4076],
      [2_300_000, 10978], [100_000, 2749], [300_000, 16743], [100_000, 2052], [100_000, 996], [400_000, 5401],
    ];
    const itens = planilha.map(([quantidade, precoReferencia], i) => ({
      id: String(i), quantidade, precoReferencia, precoUnitario: precoReferencia, valorTotal: null,
    }));
    const { valorOs } = aplicarDesconto(itens, 30.6, "SIMPLES");
    expect(valorOs).toBe(784_476);
    expect(totaisOrcamento({ itens, precoBase: "COM_BDI", desconto: 30.6 }).totalComBdi).toBe(1_130_370);
  });

  it("OS01L3 antiga (lote de 30,6%): R$ 7.261,49 na regra simples e R$ 7.265,48 na SCOAM", () => {
    const planilha: [number, number][] = [
      [100_000, 5357], [100_000, 25335], [23_500_000, 77], [23_500_000, 2415], [2_150_000, 1072], [2_150_000, 3842],
      [2_300_000, 10744], [100_000, 2811], [300_000, 16681], [100_000, 2016], [100_000, 952], [400_000, 5357],
    ];
    const itens = planilha.map(([quantidade, precoReferencia], i) => ({
      id: String(i), quantidade, precoReferencia, precoUnitario: precoReferencia, valorTotal: null,
    }));
    // 10.463,25 × 0,694 = 7.261,4955: linha a linha, 7.261,49
    expect(aplicarDesconto(itens, 30.6, "SIMPLES").valorOs).toBe(726_149);
    expect(aplicarDesconto(itens, 30.6, "SCOAM").valorOs).toBe(726_548);
  });
});

describe("supressão", () => {
  // Reboco de 10 m² com 4 m² suprimidos: valem 6 m²
  const suprimido: ItemPlanilha = { ...reboco, quantidadeSuprimida: 400_000 };
  const inteiro: ItemPlanilha = { ...pintura, quantidadeSuprimida: pintura.quantidade };

  it("o orçado, o saldo e o valor saem da quantidade efetiva", () => {
    expect(quantidadeEfetiva(suprimido)).toBe(600_000);
    expect(valorOrcadoItem(suprimido)).toBe(30_000);
    const { itens, totais } = computePanorama({ itens: [suprimido, inteiro], medidoFechado: qtd([["i-1", 200_000]]), rascunho: qtd() });
    expect(itens[0]).toMatchObject({ orcado: 600_000, suprimido: 400_000, saldo: 400_000, valorSaldo: 20_000, completo: false });
    expect(itens[1]).toMatchObject({ orcado: 0, suprimido: 333_300, valorOrcado: 0, saldo: 0, completo: true });
    expect(totais.valorOrcado).toBe(30_000);
  });

  it("a supressão ignora o total ajustado da quantidade cheia", () => {
    const ajustado: ItemPlanilha = { ...pintura, valorTotal: 4112, quantidadeSuprimida: 33_300 };
    expect(valorOrcadoItem(ajustado)).toBe(valorItem(300_000, 1234));
    expect(valorAcumuladoItem(ajustado, 300_000)).toBe(valorItem(300_000, 1234));
  });

  it("as linhas da medição levam o orçado efetivo e a supressão", () => {
    const { linhas } = computeLinhasMedicao({ itens: [suprimido], anterior: qtd([["i-1", 200_000]]), esta: qtd([["i-1", 400_000]]) });
    expect(linhas[0]).toMatchObject({ orcado: 600_000, suprimido: 400_000, acumulado: 600_000, saldo: 0, valorSaldo: 0 });
  });

  it("a medição não passa do saldo efetivo nem mede item suprimido por inteiro", () => {
    const base = { itens: [suprimido, inteiro], medidoFechado: qtd() };
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "i-1", quantidade: 600_000 }] })).not.toThrow();
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "i-1", quantidade: 600_100 }] })).toThrow(/max 6,00 m²/);
    expect(() => validateMedicaoQuantidades({ ...base, linhas: [{ item_id: "i-2", quantidade: 100 }] })).toThrow(/suppressed/);
  });

  it("o total com BDI e o novo desconto também saem da quantidade efetiva", () => {
    const comReferencia = { ...suprimido, precoReferencia: 6000 };
    expect(totaisOrcamento({ itens: [comReferencia], precoBase: "COM_BDI", desconto: 0 }).totalComBdi).toBe(36_000);
    expect(aplicarDesconto([comReferencia], 25).valorOs).toBe(valorItem(600_000, 4500));
  });

  describe("no orçamento", () => {
    const novo = (overrides: Partial<OrcamentoItemInput>): OrcamentoItemInput => ({
      id: reboco.id,
      codigo: null,
      descricao: reboco.descricao,
      etapa: null,
      unidade: reboco.unidade,
      quantidade: reboco.quantidade,
      quantidadeSuprimida: 0,
      precoUnitario: reboco.precoUnitario,
      valorTotal: null,
      precoReferencia: null,
      ...overrides,
    });
    const run = (item: OrcamentoItemInput, medido = 0) =>
      validateOrcamentoChange({ atuais: [reboco], novos: [item], medidoFechado: qtd([["i-1", medido]]) });

    it("aceita de zero até a quantidade inteira", () => {
      expect(() => run(novo({ quantidadeSuprimida: 400_000 }))).not.toThrow();
      expect(() => run(novo({ quantidadeSuprimida: 1_000_000 }))).not.toThrow();
    });

    it("recusa supressão negativa, acima da quantidade ou com total ajustado", () => {
      expect(() => run(novo({ quantidadeSuprimida: -1 }))).toThrow(/quantidade suprimida/);
      expect(() => run(novo({ quantidadeSuprimida: 1_000_100 }))).toThrow(/quantidade suprimida/);
      expect(() => run(novo({ quantidadeSuprimida: 100_000, valorTotal: 50_001 }))).toThrow(/suppressed item/);
    });

    it("não deixa a supressão alcançar o que já foi medido", () => {
      expect(() => run(novo({ quantidadeSuprimida: 700_000 }), 300_000)).not.toThrow();
      expect(() => run(novo({ quantidadeSuprimida: 700_100 }), 300_000)).toThrow(/already measured/);
    });
  });
});

describe("divergência", () => {
  it("aponta só quando há diferença", () => {
    expect(divergenciaTotal(1000, 1000)).toBeNull();
    expect(divergenciaTotal(1000, 1200)).toEqual({ diferenca: -200 });
  });
});

describe("orçamento com um modo só", () => {
  it("o total com BDI soma os totais das linhas truncados, como a planilha, nas duas regras", () => {
    // 3,333 × 12,34 = 41,12922 → 41,12
    const itens = [{ quantidade: 333_300, precoReferencia: 1234, precoUnitario: 927, valorTotal: null }];
    expect(totaisOrcamento({ itens, precoBase: "COM_BDI", desconto: 24.8, regra: "SCOAM" }).totalComBdi).toBe(4112);
    expect(totaisOrcamento({ itens, precoBase: "COM_BDI", desconto: 24.8 }).totalComBdi).toBe(4112);
  });

  it("mantém o total ajustado gravado enquanto o item não muda", () => {
    const atual = { id: "i-3", quantidade: 2_755_400, quantidadeSuprimida: 0, precoUnitario: 5338, valorTotal: 147_081 };
    const novo: OrcamentoItemInput = {
      id: "i-3", codigo: "87777", descricao: "Emboço", etapa: null, unidade: "m²",
      quantidade: 2_755_400, quantidadeSuprimida: 0, precoUnitario: 5338, valorTotal: 147_083, precoReferencia: 8554,
    };
    expect(manterTotaisAjustados([atual], [novo])[0]!.valorTotal).toBe(147_081);
    // Mudou a quantidade, a supressão ou o preço: vale o calculado pela regra
    expect(manterTotaisAjustados([atual], [{ ...novo, quantidade: 2_800_000 }])[0]!.valorTotal).toBe(147_083);
    expect(manterTotaisAjustados([atual], [{ ...novo, quantidadeSuprimida: 100_000 }])[0]!.valorTotal).toBe(147_083);
    expect(manterTotaisAjustados([atual], [{ ...novo, id: undefined }])[0]!.valorTotal).toBe(147_083);
    expect(manterTotaisAjustados([{ ...atual, valorTotal: null }], [novo])[0]!.valorTotal).toBe(147_083);
  });
});

describe("unidade de item medido", () => {
  it("unidade gravada fora do padrão (\"M²\") não conta como troca", () => {
    const atual: ItemPlanilha = { ...reboco, unidade: "M²" };
    const novo: OrcamentoItemInput = {
      id: reboco.id, codigo: null, descricao: reboco.descricao, etapa: null, unidade: "m²",
      quantidade: reboco.quantidade, quantidadeSuprimida: 0, precoUnitario: reboco.precoUnitario, valorTotal: null, precoReferencia: null,
    };
    const medidoFechado = new Map([[reboco.id, 1000]]);
    expect(() => validateOrcamentoChange({ atuais: [atual], novos: [novo], medidoFechado })).not.toThrow();
    expect(() => validateOrcamentoChange({ atuais: [atual], novos: [{ ...novo, unidade: "m³" }], medidoFechado })).toThrow(
      /unidade of a measured item/,
    );
  });
});
