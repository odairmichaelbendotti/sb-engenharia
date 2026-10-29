import { useState } from "react";
import type { AnexoOs, AnexoPadraoCodigo } from "../../../types/ordem-servico";

// Espelho de backend/src/domain/documents/anexos-os.ts: mudou lá, mudar aqui
export const ANEXOS_PADRAO: readonly {
  codigo: AnexoPadraoCodigo;
  titulo: string;
}[] = [
  { codigo: "PLANILHA_SINTETICA", titulo: "Planilha Orçamentária Sintética" },
  { codigo: "PLANILHA_ANALITICA", titulo: "Planilha Orçamentária Analítica" },
  { codigo: "CRONOGRAMA", titulo: "Cronograma Físico-Financeiro" },
  { codigo: "PREMISSAS_TECNICAS", titulo: "Premissas Técnicas" },
  { codigo: "PRODUTIVIDADE_SINAPI", titulo: "Produtividade (SINAPI)" },
  {
    codigo: "OBSERVACOES_TECNICAS",
    titulo: "Observações Técnicas para Execução",
  },
];

export const MAX_ANEXOS = 30;
export const MAX_TITULO_ANEXO = 150;
export const MAX_OBSERVACAO_ANEXO = 500;
export const MAX_COMENTARIOS_TECNICOS = 50;
export const MAX_COMENTARIO_TECNICO = 1000;

// Chave das linhas da lista (só identifica a linha na tela)
let ultimaChave = 0;
const novaChave = () => ++ultimaChave;

export type AnexoPadraoForm = { marcado: boolean; observacao: string };
export type AnexoOutroForm = {
  key: number;
  titulo: string;
  observacao: string;
};
export type ComentarioForm = { key: number; texto: string };

/** Número romano do anexo (1 → I), para a prévia da numeração. */
export function numeroRomano(n: number): string {
  const tabela: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let resto = n;
  let texto = "";
  for (const [valor, simbolo] of tabela) {
    while (resto >= valor) {
      texto += simbolo;
      resto -= valor;
    }
  }
  return texto;
}

/**
 * Estado da etapa Anexos do cadastro da OS. OS nova e OS anterior à escolha (anexos null) abrem
 * com os seis padrão marcados, que é o que o PDF delas já mostrava.
 */
export function useAnexosForm(
  anexos: AnexoOs[] | null | undefined,
  comentarios: string[] | undefined,
) {
  const [padrao, setPadrao] = useState<
    Record<AnexoPadraoCodigo, AnexoPadraoForm>
  >(() => {
    const escolhidos =
      anexos ??
      ANEXOS_PADRAO.map((a) => ({
        codigo: a.codigo,
        titulo: a.titulo,
        observacao: null,
      }));
    return Object.fromEntries(
      ANEXOS_PADRAO.map((a) => {
        const escolhido = escolhidos.find((e) => e.codigo === a.codigo);
        return [
          a.codigo,
          { marcado: !!escolhido, observacao: escolhido?.observacao ?? "" },
        ];
      }),
    ) as Record<AnexoPadraoCodigo, AnexoPadraoForm>;
  });
  const [outros, setOutros] = useState<AnexoOutroForm[]>(() =>
    (anexos ?? [])
      .filter((a) => a.codigo === null)
      .map((a) => ({
        key: novaChave(),
        titulo: a.titulo,
        observacao: a.observacao ?? "",
      })),
  );
  const [comentariosTecnicos, setComentariosTecnicos] = useState<
    ComentarioForm[]
  >(() => (comentarios ?? []).map((texto) => ({ key: novaChave(), texto })));

  // Ordem do PDF: os padrão marcados, na ordem da lista, e depois os adicionados
  const selecionados: { key: string; titulo: string }[] = [
    ...ANEXOS_PADRAO.filter((a) => padrao[a.codigo].marcado).map((a) => ({
      key: a.codigo,
      titulo: a.titulo,
    })),
    ...outros.map((o) => ({
      key: `outro-${o.key}`,
      titulo: o.titulo.trim() || "Anexo sem nome",
    })),
  ];

  function validate(): string | null {
    if (selecionados.length > MAX_ANEXOS)
      return `A OS aceita no máximo ${MAX_ANEXOS} anexos`;
    if (outros.some((o) => !o.titulo.trim()))
      return "Informe o nome de cada anexo adicionado (ou remova a linha)";
    if (outros.some((o) => o.titulo.trim().length > MAX_TITULO_ANEXO)) {
      return `O nome do anexo aceita no máximo ${MAX_TITULO_ANEXO} caracteres`;
    }
    const observacoes = [
      ...ANEXOS_PADRAO.filter((a) => padrao[a.codigo].marcado).map(
        (a) => padrao[a.codigo].observacao,
      ),
      ...outros.map((o) => o.observacao),
    ];
    if (observacoes.some((o) => o.trim().length > MAX_OBSERVACAO_ANEXO)) {
      return `A observação do anexo aceita no máximo ${MAX_OBSERVACAO_ANEXO} caracteres`;
    }
    const linhas = comentariosTecnicos
      .map((c) => c.texto.trim())
      .filter(Boolean);
    if (linhas.length > MAX_COMENTARIOS_TECNICOS) {
      return `A OS aceita no máximo ${MAX_COMENTARIOS_TECNICOS} comentários técnicos`;
    }
    if (linhas.some((c) => c.length > MAX_COMENTARIO_TECNICO)) {
      return `Cada comentário técnico aceita no máximo ${MAX_COMENTARIO_TECNICO} caracteres`;
    }
    return null;
  }

  function toPayload(): { anexos: AnexoOs[]; comentariosTecnicos: string[] } {
    return {
      anexos: [
        ...ANEXOS_PADRAO.filter((a) => padrao[a.codigo].marcado).map((a) => ({
          codigo: a.codigo,
          titulo: a.titulo,
          observacao: padrao[a.codigo].observacao.trim() || null,
        })),
        ...outros.map((o) => ({
          codigo: null,
          titulo: o.titulo.trim(),
          observacao: o.observacao.trim() || null,
        })),
      ],
      comentariosTecnicos: comentariosTecnicos
        .map((c) => c.texto.trim())
        .filter(Boolean),
    };
  }

  return {
    padrao,
    outros,
    comentariosTecnicos,
    selecionados,
    togglePadrao: (codigo: AnexoPadraoCodigo) =>
      setPadrao((prev) => ({
        ...prev,
        [codigo]: { ...prev[codigo], marcado: !prev[codigo].marcado },
      })),
    setObservacaoPadrao: (codigo: AnexoPadraoCodigo, observacao: string) =>
      setPadrao((prev) => ({
        ...prev,
        [codigo]: { ...prev[codigo], observacao },
      })),
    addOutro: () =>
      setOutros((prev) => [
        ...prev,
        { key: novaChave(), titulo: "", observacao: "" },
      ]),
    updateOutro: (key: number, patch: Partial<Omit<AnexoOutroForm, "key">>) =>
      setOutros((prev) =>
        prev.map((o) => (o.key === key ? { ...o, ...patch } : o)),
      ),
    removeOutro: (key: number) =>
      setOutros((prev) => prev.filter((o) => o.key !== key)),
    addComentario: () =>
      setComentariosTecnicos((prev) => [
        ...prev,
        { key: novaChave(), texto: "" },
      ]),
    updateComentario: (key: number, texto: string) =>
      setComentariosTecnicos((prev) =>
        prev.map((c) => (c.key === key ? { ...c, texto } : c)),
      ),
    removeComentario: (key: number) =>
      setComentariosTecnicos((prev) => prev.filter((c) => c.key !== key)),
    validate,
    toPayload,
  };
}

export type AnexosForm = ReturnType<typeof useAnexosForm>;
