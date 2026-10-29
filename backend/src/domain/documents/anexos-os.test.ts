import { describe, expect, it } from "vitest";
import { anexosDaOs, anexosPadrao, numeroRomano, parseAnexos, parseComentariosTecnicos } from "./anexos-os.js";

const igual = (texto: string) => texto;

describe("parseAnexos", () => {
  it("ausente mantém o atual (undefined); lista vazia = OS sem anexos", () => {
    expect(parseAnexos(undefined, igual)).toBeUndefined();
    expect(parseAnexos([], igual)).toEqual([]);
  });

  it("os padrão ficam na ordem e com o título da lista; os outros vêm depois, na ordem enviada", () => {
    const anexos = parseAnexos(
      [
        { codigo: null, titulo: "  Projeto de SPDA ", observacao: "" },
        { codigo: "CRONOGRAMA", titulo: "qualquer", observacao: " Revisão 2 " },
        { codigo: "PLANILHA_SINTETICA" },
        { titulo: "memorial descritivo" },
      ],
      igual,
    );
    expect(anexos).toEqual([
      { codigo: "PLANILHA_SINTETICA", titulo: "Planilha Orçamentária Sintética", observacao: null },
      { codigo: "CRONOGRAMA", titulo: "Cronograma Físico-Financeiro", observacao: "Revisão 2" },
      { codigo: null, titulo: "Projeto de SPDA", observacao: null },
      { codigo: null, titulo: "Memorial descritivo", observacao: null },
    ]);
  });

  it("barra código desconhecido, anexo repetido e anexo adicionado sem nome", () => {
    expect(() => parseAnexos([{ codigo: "XYZ" }], igual)).toThrow();
    expect(() => parseAnexos([{ codigo: "CRONOGRAMA" }, { codigo: "CRONOGRAMA" }], igual)).toThrow();
    expect(() => parseAnexos([{ titulo: "  " }], igual)).toThrow();
    expect(() => parseAnexos("x", igual)).toThrow();
  });
});

describe("parseComentariosTecnicos", () => {
  it("tira as linhas vazias e mantém a ordem", () => {
    expect(parseComentariosTecnicos(["Conferir prumo", " ", "Usar EPI "], igual)).toEqual(["Conferir prumo", "Usar EPI"]);
    expect(parseComentariosTecnicos(undefined, igual)).toBeUndefined();
  });
});

describe("anexos da OS", () => {
  it("OS anterior à escolha (null) leva os seis padrão", () => {
    expect(anexosDaOs(null)).toEqual(anexosPadrao());
    expect(anexosDaOs(null)).toHaveLength(6);
    expect(anexosDaOs([])).toEqual([]);
  });

  it("numera em romano", () => {
    expect([1, 4, 6, 9, 14, 30].map(numeroRomano)).toEqual(["I", "IV", "VI", "IX", "XIV", "XXX"]);
  });
});
