import { create } from "zustand";

// Registros que abrem no modal de visualização único (components/EntityViewer)
export type EntityKind = "empresa" | "contrato" | "empenho" | "ordemServico" | "obra" | "invoice";

export type EntityRef = { kind: EntityKind; id: string };

type Editor = (id: string) => void;

type EntityViewerState = {
  // Pilha de registros: o de cima aparece; clicar num vínculo empilha e "Voltar" desempilha
  stack: EntityRef[];
  // Tela (pathname) em que a pilha foi aberta: trocar de tela esconde o modal
  openedAt: string | null;
  // Ação "Editar" de cada tipo, registrada pela página que tem o formulário daquele registro
  editors: Partial<Record<EntityKind, Editor>>;
  open: (ref: EntityRef) => void;
  push: (ref: EntityRef) => void;
  back: () => void;
  close: () => void;
  registerEditor: (kind: EntityKind, editor: Editor) => () => void;
};

export const useEntityViewer = create<EntityViewerState>((set) => ({
  stack: [],
  openedAt: null,
  editors: {},

  open: (ref) => set({ stack: [ref], openedAt: window.location.pathname }),

  push: (ref) =>
    set((state) => {
      const top = state.stack[state.stack.length - 1];
      if (top && top.kind === ref.kind && top.id === ref.id) return state;
      // Pilha vazia (vínculo clicado num modal da própria página): passa a valer nesta tela
      if (!top) return { stack: [ref], openedAt: window.location.pathname };
      return { stack: [...state.stack, ref] };
    }),

  back: () => set((state) => ({ stack: state.stack.slice(0, -1) })),

  close: () => set({ stack: [], openedAt: null }),

  registerEditor: (kind, editor) => {
    set((state) => ({ editors: { ...state.editors, [kind]: editor } }));
    return () =>
      set((state) => {
        if (state.editors[kind] !== editor) return state;
        const editors = { ...state.editors };
        delete editors[kind];
        return { editors };
      });
  },
}));
