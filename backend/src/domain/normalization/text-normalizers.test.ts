import { describe, expect, it } from "vitest";
import {
  cleanText,
  digitsOnly,
  normalizeCode,
  normalizeEmail,
  normalizeEmpenhoNumero,
  normalizeFreeText,
  normalizeMultilineText,
  normalizeProperName,
  normalizeUf,
  normalizeUpperName,
} from "./text-normalizers.js";
import { EMPENHO_RULES, normalizeInput } from "./input-rules.js";

describe("cleanText", () => {
  it("remove espaços extras, invisíveis e unifica acentos", () => {
    expect(cleanText("  Seção\u00A0de   Engenharia\u200B ")).toBe("Seção de Engenharia");
    // "é" decomposto (e + acento) vira o caractere composto
    expect(cleanText("Mane\u0301")).toBe("Mané");
  });
});

describe("códigos", () => {
  it("nº do empenho fica em maiúsculas e sem espaços", () => {
    expect(normalizeEmpenhoNumero(" 2026 ne 000606 ")).toBe("2026NE000606");
    expect(normalizeEmpenhoNumero("2026Ne000606")).toBe("2026NE000606");
  });

  it("demais códigos ficam em maiúsculas, sem espaço em volta de separadores", () => {
    expect(normalizeCode("14 / bfl / 2026")).toBe("14/BFL/2026");
    expect(normalizeCode("e - 050")).toBe("E-050");
    expect(normalizeCode("pe  12")).toBe("PE 12");
  });
});

describe("nomes", () => {
  it("razão social fica toda em maiúsculas", () => {
    expect(normalizeUpperName("Aej  engenharia ltda")).toBe("AEJ ENGENHARIA LTDA");
  });

  it("nomes próprios ganham inicial maiúscula e preposições minúsculas", () => {
    expect(normalizeProperName("JOÃO DA SILVA")).toBe("João da Silva");
    expect(normalizeProperName("maria dos santos e souza")).toBe("Maria dos Santos e Souza");
    expect(normalizeProperName("são josé")).toBe("São José");
    expect(normalizeProperName("ana-clara")).toBe("Ana-Clara");
  });
});

describe("texto livre", () => {
  it("não mexe em texto com maiúsculas e minúsculas misturadas", () => {
    expect(normalizeFreeText("Reforma do PNR da BAFL")).toBe("Reforma do PNR da BAFL");
    expect(normalizeFreeText("manutenção predial")).toBe("manutenção predial");
  });

  it("texto todo em maiúsculas vira frase normal preservando siglas e códigos", () => {
    expect(normalizeFreeText("REFORMA DO PNR DA BAFL")).toBe("Reforma do PNR da BAFL");
    expect(normalizeFreeText("TROCA DO QGBT. BLOCO A1 CONCLUÍDO")).toBe("Troca do QGBT. Bloco A1 concluído");
    expect(normalizeFreeText("EMPENHO 2026NE000606 SEÇÃO DE ENGENHARIA")).toBe(
      "Empenho 2026NE000606 seção de engenharia",
    );
  });

  it("uma palavra só em maiúsculas é mantida (pode ser sigla)", () => {
    expect(normalizeFreeText("SCOAM")).toBe("SCOAM");
  });

  it("texto de várias linhas mantém as quebras", () => {
    expect(normalizeMultilineText("LINHA UM  \r\n\r\n\r\n  LINHA DOIS")).toBe("Linha um\n\nLinha dois");
  });
});

describe("contato e documentos", () => {
  it("CNPJ, CEP e telefone guardam só dígitos", () => {
    expect(digitsOnly("12.345.678/0001-90")).toBe("12345678000190");
    expect(digitsOnly("88049-000")).toBe("88049000");
    expect(digitsOnly("(48) 99643-9382")).toBe("48996439382");
  });

  it("e-mail fica minúsculo e sem espaços", () => {
    expect(normalizeEmail(" Joao.Silva @FAB.mil.br ")).toBe("joao.silva@fab.mil.br");
  });

  it("UF fica em maiúsculas", () => {
    expect(normalizeUf(" sc ")).toBe("SC");
  });
});

describe("normalizeInput", () => {
  it("aplica só aos campos de texto presentes e preserva os demais", () => {
    const result = normalizeInput(
      { numero: "2026 ne 000606", value: 10, contrato_id: "abc" },
      EMPENHO_RULES,
    );
    expect(result).toEqual({ numero: "2026NE000606", value: 10, contrato_id: "abc" });
  });
});
